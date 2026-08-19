import type { DB } from "../client.js";
import type { Region, ExchangeRate } from "@pst/types";

export async function listRegions(db: DB): Promise<Region[]> {
  const { data, error } = await db.from("regions").select("*").order("code");
  if (error) throw error;
  return (data ?? []).map(toRegion);
}

export async function getRegionByCode(db: DB, code: string) {
  const { data, error } = await db.from("regions").select("*").eq("code", code).maybeSingle();
  if (error) throw error;
  return data ? toRegion(data) : null;
}

export function toRegion(row: {
  id: string;
  code: string;
  name: string;
  currency: string;
  currency_symbol: string;
  flag_emoji: string;
  store_locale: string;
}): Region {
  return {
    id: row.id,
    code: row.code as Region["code"],
    name: row.name,
    currency: row.currency,
    currencySymbol: row.currency_symbol,
    flagEmoji: row.flag_emoji,
    storeLocale: row.store_locale,
  };
}

export async function listExchangeRates(db: DB): Promise<ExchangeRate[]> {
  const { data, error } = await db.from("exchange_rates").select("*").order("currency");
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, currency: r.currency, phpRate: Number(r.php_rate), updatedAt: r.updated_at }));
}

/** Returns a lookup map of ISO currency code -> PHP rate, e.g. { USD: 58.2 } */
export async function getRateMap(db: DB): Promise<Record<string, number>> {
  const rates = await listExchangeRates(db);
  return Object.fromEntries(rates.map((r) => [r.currency, r.phpRate]));
}

export async function upsertExchangeRate(db: DB, currency: string, phpRate: number) {
  const { error } = await db
    .from("exchange_rates")
    .upsert({ currency, php_rate: phpRate, updated_at: new Date().toISOString() }, { onConflict: "currency" });
  if (error) throw error;
}
