# PlayStation Sale Tracker

Tracks PlayStation Store prices across multiple regions, converts them to PHP, and surfaces sales, discounts,
and historical lowest prices — with a full price-history record for every game/region pair.

**Stack:** React + TypeScript + Vite + Tailwind (frontend) · Cloudflare Workers + TypeScript (API) · Supabase
Postgres (database) · Cloudflare Pages (frontend hosting).

---

## 1. Project structure

```
playstation-sale-tracker/
├── apps/
│   ├── web/                     # React + Vite + Tailwind frontend
│   │   └── src/
│   │       ├── components/      # GameCard, PriceBlock, Navbar, chart, states, etc.
│   │       ├── pages/           # Home, Games, GameDetail, Sales, Regions, Search, Admin...
│   │       ├── hooks/useApi.ts  # generic fetch/loading/error hook
│   │       └── lib/api.ts       # typed client - the ONLY thing that talks to the API
│   └── api/                     # Cloudflare Worker (REST API + cron)
│       └── src/
│           ├── routes/          # games, sales, regions, search, admin
│           ├── providers/       # PriceProvider interface + mock implementation
│           ├── services/        # ingestion runner, exchange rates, enrichment
│           ├── middleware/      # admin bearer-token auth
│           └── index.ts         # router + fetch/scheduled entrypoints
├── packages/
│   ├── types/                   # shared TypeScript domain types (single source of truth)
│   ├── shared/                  # currency math, slugify, region metadata
│   └── database/                # Supabase client + typed queries, used only by apps/api
├── supabase/
│   └── migrations/               # 0001_init.sql (schema), 0002_seed_regions.sql (seed data)
├── package.json                  # npm workspaces root
└── README.md
```

Why this shape: the frontend never imports `@pst/database` or holds Supabase credentials — it only calls
`apps/api` over HTTP through `apps/web/src/lib/api.ts`. All privileged database access lives in the Worker,
which is the only place the Supabase **service-role** key is ever used.

---

## 2. Assumptions made

1. **No public PlayStation Store API exists.** The provider layer (`apps/api/src/providers/`) ships a clearly
   labeled **mock provider** (`isMock: true` on every provider) with realistic hand-written sample data. See
   `mockCatalog.ts` for the full explanation and replacement instructions — the app never pretends this is live
   data.
2. **Exchange rates** default to static fallback values (`apps/api/src/services/exchangeRates.ts`). A real
   provider can be wired in by setting `EXCHANGE_RATE_API_KEY`; until then, rates are refreshed on your own
   schedule via the admin dashboard or cron, using the fallback table.
3. **Single-operator admin.** The admin area uses one shared bearer token (`ADMIN_API_TOKEN`), not a full user
   system — appropriate for a personal project. Swap for Supabase Auth + role claims if you need multiple admins.
4. **RLS is enabled with no public policies** — every table is currently readable only via the service-role key
   used by the Worker. If you later want the frontend to read Supabase directly, add explicit `select`-only
   policies (see the comment at the bottom of `0001_init.sql`).
5. Pricing "lowest price ever" ranking treats "at or near" as **within 5% of the all-time recorded low**.

---

## 3. Database schema

See `supabase/migrations/0001_init.sql` for the authoritative version. Summary:

| Table | Purpose | Key constraints |
|---|---|---|
| `regions` | One row per tracked storefront region | unique `code` |
| `games` | One row per game | unique `slug`, full-text index on `title` |
| `game_prices` | **Current** snapshot per (game, region) | unique `(game_id, region_id)`, indexed on `is_on_sale`, `discount_percentage`, `sale_end` |
| `price_history` | **Append-only** record of every observed price | never updated/overwritten; indexed on `(game_id, region_id, recorded_at)` |
| `exchange_rates` | Latest PHP rate per currency | unique `currency` |
| `update_runs` | One row per ingestion run, for the admin dashboard | indexed on `started_at` |

Prices are always stored in their **original currency** — PHP is computed at read time using the latest
`exchange_rates` row (`packages/shared/src/currency.ts`), never persisted as the source of truth.

---

## 4. Environment variables

### `apps/api` (Cloudflare Worker secrets — never commit these)

| Name | Required | Purpose |
|---|---|---|
| `SUPABASE_URL` | yes | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Service-role key — Worker-only, bypasses RLS |
| `ADMIN_API_TOKEN` | yes | Shared secret protecting `/api/admin/*` |
| `EXCHANGE_RATE_API_KEY` | no | Enables the live exchange-rate provider once you choose one |

Non-secret config lives in `apps/api/wrangler.toml` under `[vars]` (`CORS_ALLOWED_ORIGIN`, `ENVIRONMENT`).

### `apps/web` (Cloudflare Pages / local `.env`)

| Name | Required | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | yes | Base URL of the deployed (or local) Worker API |

The frontend **never** receives `SUPABASE_SERVICE_ROLE_KEY` or any Supabase credential — it only knows the
Worker's URL.

---

## 5. Local development

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) project
- A free [Cloudflare](https://dash.cloudflare.com) account (for `wrangler`)

### Install
```bash
npm install
```

### Set up Supabase
1. Create a new Supabase project.
2. In the SQL editor (or via `supabase db push` if you use the Supabase CLI), run the migrations in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_seed_regions.sql`
3. Copy your **Project URL** and **service_role key** (Project Settings → API).

### Configure the API worker
```bash
cd apps/api
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put ADMIN_API_TOKEN
```
For local dev, `wrangler` also reads a `.dev.vars` file instead of prompting each time:
```
# apps/api/.dev.vars  (gitignored)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_API_TOKEN=choose-a-long-random-string
```

Run the API locally:
```bash
npm run dev:api        # from repo root - starts wrangler dev on http://localhost:8787
```

### Configure and run the frontend
```bash
cp apps/web/.env.example apps/web/.env
# VITE_API_BASE_URL=http://localhost:8787 (default is already correct for local dev)

npm run dev:web         # starts Vite on http://localhost:5173
```

### Populate data
The database starts empty (only regions + placeholder exchange rates are seeded). To pull in mock catalog data:
1. Open `http://localhost:5173/admin`.
2. Sign in with your `ADMIN_API_TOKEN`.
3. Click **"Trigger price update now"** — this runs the same ingestion pipeline the cron job uses, against the
   mock provider, for all four regions.

---

## 6. Running tests
```bash
npm run test --workspace=apps/api
```
Covers currency conversion, discount math, mock catalog integrity (sale price never exceeds original price), and
price-history statistics (lowest/highest/average/times-on-sale).

---

## 7. Deployment

### Supabase
Already covered in step 5 above — migrations are the only setup needed. Free tier is sufficient for this
project's scale (a few thousand games, a few hundred thousand history rows before you'd need to upgrade).

### Cloudflare Workers (API)
```bash
cd apps/api
npx wrangler deploy
```
Make sure the same three secrets are set on the deployed Worker (`wrangler secret put ...` targets whichever
account/Worker you're logged into). Update `CORS_ALLOWED_ORIGIN` in `wrangler.toml`'s `[env.production]` block to
your deployed Pages URL before deploying.

### Cloudflare Pages (frontend)
1. Push this repo to GitHub.
2. In the Cloudflare dashboard: Pages → Create a project → Connect to Git.
3. Build settings:
   - **Build command:** `npm run build --workspace=apps/web`
   - **Build output directory:** `apps/web/dist`
   - **Root directory:** `/` (monorepo — npm workspaces need the repo root)
4. Add the environment variable `VITE_API_BASE_URL` set to your deployed Worker URL
   (e.g. `https://playstation-sale-tracker-api.<your-subdomain>.workers.dev`).
5. Deploy. No custom/paid domain is required — both `*.pages.dev` and `*.workers.dev` subdomains are free.

### Scheduled jobs
The cron trigger is already declared in `apps/api/wrangler.toml`:
```toml
[triggers]
crons = ["0 */6 * * *"]   # every 6 hours
```
Cron triggers activate automatically on `wrangler deploy` — no extra dashboard step needed. Adjust the cron
expression to change frequency (more frequent runs cost more Worker CPU time on paid tiers, and more upstream
calls once a real exchange-rate/price provider is wired in).

---

## 8. Replacing the mock provider with real data

1. Identify a data source you're legally permitted to use for each region (e.g. a scraper you have the rights
   to run, a licensed third-party pricing API, or manual/CSV entry from store pages you monitor yourself).
   **PlayStation does not publish a public, unauthenticated pricing API** — do not point this at an invented
   endpoint.
2. Implement the `PriceProvider` interface (`packages/types/src/index.ts`) for that source, e.g.
   `apps/api/src/providers/usProvider.live.ts`.
3. Swap the implementation in `apps/api/src/providers/registry.ts` — this is the **only** file that needs to
   change. Every route, the ingestion runner, and the scheduled job depend only on the `PriceProvider` interface,
   never on a concrete provider.
4. Do the same for exchange rates: set `EXCHANGE_RATE_API_KEY` and fill in the real request/response parsing in
   `createLiveProvider()` inside `apps/api/src/services/exchangeRates.ts`.

---

## 9. How the system works, end to end

1. **Ingestion (cron, every 6h, or manual via Admin):** `scheduled()` in `apps/api/src/index.ts` calls
   `refreshExchangeRates()` then `runIngestionForAllRegions()`.
2. **Per region:** `runIngestionForRegion()` calls the registered `PriceProvider.getGames()`, then for each raw
   result calls `ingestRawPrice()` (`packages/database`), which:
   - upserts the `games` row (matched by slugified title),
   - upserts the `game_prices` current snapshot,
   - inserts a `price_history` row **only if the effective price changed** since the last recorded value.
   Every run is logged to `update_runs` (success/failure, counts), regardless of outcome.
3. **Reads:** the frontend calls `apps/api` REST endpoints (`/api/games`, `/api/sales/*`, `/api/games/:slug`,
   etc.). The Worker fetches rows via `@pst/database`, then `services/enrich.ts` attaches a live PHP conversion
   using the latest `exchange_rates` row and determines the cheapest region per game.
4. **Price history & stats:** `/api/games/:id/history` returns the full append-only series plus computed
   lowest/highest/average/price-change/times-on-sale (`packages/database/src/queries/history.ts`).
5. **Admin:** `/api/admin/*` routes are protected by a bearer token check (`middleware/adminAuth.ts`) and expose
   stats, recent update runs, and manual triggers for both the price-ingestion pipeline and the exchange-rate
   refresh.

---

## 10. API reference

| Method | Path | Description |
|---|---|---|
| GET | `/api/games` | Paginated game list, with filters (`q`, `platform`, `sort`) |
| GET | `/api/games/:slug` | Full game detail: prices, historical lowest, price history |
| GET | `/api/games/:id/prices` | Current prices for a game, all regions |
| GET | `/api/games/:id/history` | Price history + computed stats (optionally filtered by `region`) |
| GET | `/api/sales` | Current sales (filters: `region`, `minDiscount`) |
| GET | `/api/sales/biggest-discounts` | Ranked by discount percentage |
| GET | `/api/sales/lowest-prices` | Games at/near their historical low |
| GET | `/api/regions` | List of tracked regions |
| GET | `/api/exchange-rates` | Latest stored PHP rates |
| GET | `/api/search?q=` | Title search |
| GET | `/api/admin/stats` | 🔒 Admin stats |
| GET | `/api/admin/update-runs` | 🔒 Recent ingestion run history |
| POST | `/api/admin/trigger-update` | 🔒 Manually run the ingestion pipeline |
| POST | `/api/admin/refresh-rates` | 🔒 Manually refresh exchange rates |

🔒 = requires `Authorization: Bearer <ADMIN_API_TOKEN>`.

All list endpoints are paginated (`page`, `pageSize`, capped at 100) and return `{ data, pagination }`. Errors
return `{ error: { code, message } }` with an appropriate HTTP status.

---

## 11. Security notes

- Supabase **service-role key** exists only as a Worker secret, never in frontend code or client responses.
- RLS is enabled on every table with no public policies — reads are only possible through the Worker.
- Admin endpoints require a bearer token compared against a Worker secret.
- All query parameters are validated/clamped (`clampInt`, required fields checked) before hitting the database.
- Postgres parameterization via `supabase-js` prevents SQL injection — no raw string interpolation into SQL.
- There is no public write endpoint; all writes happen through the ingestion pipeline or admin-token-protected
  routes.
