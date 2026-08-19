import type { DB } from "@pst/database";
import { upsertExchangeRate } from "@pst/database";
import type { Env } from "../env.js";
import { getExchangeRateProvider } from "./exchangeRates.js";

const TRACKED_CURRENCIES = ["USD", "SGD", "HKD", "TRY", "PHP"];

export async function refreshExchangeRates(db: DB, env: Env) {
  const provider = getExchangeRateProvider(env);
  const rates = await provider.getRates(TRACKED_CURRENCIES);
  for (const [currency, rate] of Object.entries(rates)) {
    await upsertExchangeRate(db, currency, rate);
  }
  return { provider: provider.name, currencies: Object.keys(rates) };
}
