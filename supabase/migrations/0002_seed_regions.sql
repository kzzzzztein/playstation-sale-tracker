-- ============================================================================
-- Seed initial regions and placeholder exchange rates.
-- Exchange rates seeded here are STARTING VALUES ONLY, clearly not live.
-- The exchange-rate service (apps/api/src/services/exchangeRates.ts) is
-- expected to refresh these on a schedule from a real provider once one is
-- configured. See README "Currency conversion" section.
-- ============================================================================

insert into regions (code, name, currency, currency_symbol, flag_emoji, store_locale)
values
  ('us', 'United States', 'USD', '$',   '🇺🇸', 'en-us'),
  ('sg', 'Singapore',     'SGD', 'S$',  '🇸🇬', 'en-sg'),
  ('hk', 'Hong Kong',     'HKD', 'HK$', '🇭🇰', 'en-hk'),
  ('tr', 'Turkey',        'TRY', '₺',   '🇹🇷', 'tr-tr')
on conflict (code) do nothing;

-- Placeholder rates (PHP per 1 unit of currency). Replace with live data -
-- see apps/api/src/services/exchangeRates.ts for the provider abstraction.
insert into exchange_rates (currency, php_rate)
values
  ('USD', 58.50),
  ('SGD', 43.20),
  ('HKD', 7.45),
  ('TRY', 1.65),
  ('PHP', 1.00)
on conflict (currency) do nothing;
