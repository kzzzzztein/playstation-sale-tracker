import type { ExchangeRateProvider } from "@pst/types";
import type { Env } from "../env.js";

/**
 * Static fallback rates (PHP per 1 unit of currency). These match the
 * migration seed values and are used when no live provider is configured.
 * They are NOT refreshed automatically - treat them as a development
 * placeholder, not production truth.
 */
const FALLBACK_RATES: Record<string, number> = {
  USD: 58.5,
  SGD: 43.2,
  HKD: 7.45,
  TRY: 1.65,
  PHP: 1.0,
};

function createFallbackProvider(): ExchangeRateProvider {
  return {
    name: "Static Fallback Rates (not live)",
    async getRates(currencies: string[]) {
      return Object.fromEntries(currencies.map((c) => [c, FALLBACK_RATES[c] ?? 1]));
    },
  };
}

/**
 * Real provider example (disabled until EXCHANGE_RATE_API_KEY is set).
 * exchangerate.host / open.er-api.com / a paid FX API all work here - swap
 * the fetch URL and response parsing for whichever provider you choose.
 * This function is intentionally NOT wired into getExchangeRateProvider()
 * below until you provide a real key, so the app never pretends to have
 * live rates it doesn't.
 */
function createLiveProvider(apiKey: string): ExchangeRateProvider {
  return {
    name: "Live FX Provider",
    async getRates(currencies: string[]) {
      // Example shape only - replace with your chosen provider's real
      // request/response format.
      const url = `https://api.exchangerate.host/latest?base=PHP&symbols=${currencies.join(",")}&access_key=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Exchange rate provider returned ${res.status}`);
      const json = (await res.json()) as { rates: Record<string, number> };
      // Provider returns "1 PHP = X currency", we need "1 currency = X PHP".
      return Object.fromEntries(currencies.map((c) => [c, json.rates[c] ? 1 / json.rates[c] : FALLBACK_RATES[c] ?? 1]));
    },
  };
}

export function getExchangeRateProvider(env: Env): ExchangeRateProvider {
  if (env.EXCHANGE_RATE_API_KEY) {
    return createLiveProvider(env.EXCHANGE_RATE_API_KEY);
  }
  return createFallbackProvider();
}
