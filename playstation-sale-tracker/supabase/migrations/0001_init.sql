-- ============================================================================
-- PlayStation Sale Tracker - initial schema
-- ============================================================================
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- regions
-- ----------------------------------------------------------------------------
create table if not exists regions (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,             -- 'us' | 'sg' | 'hk' | 'tr' ...
  name            text not null,
  currency        text not null,                    -- ISO 4217, e.g. 'USD'
  currency_symbol text not null,                     -- e.g. '$'
  flag_emoji      text not null default '',
  store_locale    text not null default '',          -- PS Store locale slug, e.g. 'en-us'
  created_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- games
-- ----------------------------------------------------------------------------
create table if not exists games (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text not null unique,
  platform     text not null default 'PS5',
  cover_image  text,
  store_url    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_games_title on games using gin (to_tsvector('simple', title));
create index if not exists idx_games_slug on games (slug);
create index if not exists idx_games_platform on games (platform);

-- ----------------------------------------------------------------------------
-- game_prices  (current price snapshot per game/region - overwritten in place)
-- ----------------------------------------------------------------------------
create table if not exists game_prices (
  id                   uuid primary key default gen_random_uuid(),
  game_id              uuid not null references games (id) on delete cascade,
  region_id            uuid not null references regions (id) on delete cascade,
  original_price       numeric(12, 2) not null check (original_price >= 0),
  sale_price           numeric(12, 2) check (sale_price is null or sale_price >= 0),
  discount_percentage  integer not null default 0 check (discount_percentage between 0 and 100),
  currency             text not null,
  sale_start           timestamptz,
  sale_end             timestamptz,
  is_on_sale           boolean not null default false,
  updated_at           timestamptz not null default now(),
  unique (game_id, region_id)
);

create index if not exists idx_game_prices_game on game_prices (game_id);
create index if not exists idx_game_prices_region on game_prices (region_id);
create index if not exists idx_game_prices_on_sale on game_prices (is_on_sale) where is_on_sale = true;
create index if not exists idx_game_prices_discount on game_prices (discount_percentage desc);
create index if not exists idx_game_prices_sale_end on game_prices (sale_end) where sale_end is not null;

-- ----------------------------------------------------------------------------
-- price_history  (append-only - never updated or overwritten, see ingestion.ts)
-- ----------------------------------------------------------------------------
create table if not exists price_history (
  id           uuid primary key default gen_random_uuid(),
  game_id      uuid not null references games (id) on delete cascade,
  region_id    uuid not null references regions (id) on delete cascade,
  price        numeric(12, 2) not null check (price >= 0),
  currency     text not null,
  recorded_at  timestamptz not null default now()
);

create index if not exists idx_price_history_game_region on price_history (game_id, region_id, recorded_at desc);
create index if not exists idx_price_history_recorded_at on price_history (recorded_at desc);

-- ----------------------------------------------------------------------------
-- exchange_rates  (one row per currency, upserted on each refresh)
-- ----------------------------------------------------------------------------
create table if not exists exchange_rates (
  id          uuid primary key default gen_random_uuid(),
  currency    text not null unique,
  php_rate    numeric(12, 6) not null check (php_rate > 0),
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- update_runs  (observability for the cron ingestion jobs / admin dashboard)
-- ----------------------------------------------------------------------------
create table if not exists update_runs (
  id                          uuid primary key default gen_random_uuid(),
  region_code                 text not null,
  started_at                  timestamptz not null,
  finished_at                 timestamptz,
  success                     boolean,
  games_processed             integer not null default 0,
  prices_changed              integer not null default 0,
  history_records_inserted    integer not null default 0,
  error                       text
);

create index if not exists idx_update_runs_started_at on update_runs (started_at desc);

-- ----------------------------------------------------------------------------
-- updated_at trigger helper
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_games_updated_at on games;
create trigger trg_games_updated_at before update on games
  for each row execute function set_updated_at();

drop trigger if exists trg_game_prices_updated_at on game_prices;
create trigger trg_game_prices_updated_at before update on game_prices
  for each row execute function set_updated_at();

drop trigger if exists trg_exchange_rates_updated_at on exchange_rates;
create trigger trg_exchange_rates_updated_at before update on exchange_rates
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
-- Public (anon) read access is intentionally NOT granted here. All reads go
-- through the Cloudflare Worker API using the service-role key, per the
-- "no privileged frontend access" architecture rule. This keeps a single
-- enforcement point for pagination limits, rate limiting and future auth.
alter table regions enable row level security;
alter table games enable row level security;
alter table game_prices enable row level security;
alter table price_history enable row level security;
alter table exchange_rates enable row level security;
alter table update_runs enable row level security;

-- No policies are created, so only the service_role key (used exclusively by
-- the Worker) can read/write. If you later want the frontend to read
-- Supabase directly with the anon key, add explicit `select`-only policies
-- for the public tables (regions, games, game_prices, price_history,
-- exchange_rates) and keep update_runs / writes service-role-only.
