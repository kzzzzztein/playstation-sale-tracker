import type { DB } from "../client.js";
import type { PriceHistoryEntry, PriceStats } from "@pst/types";

interface HistoryRow {
  id: string;
  game_id: string;
  region_id: string;
  price: number;
  currency: string;
  recorded_at: string;
  regions: { code: string } | null;
}

const HISTORY_SELECT = "id, game_id, region_id, price, currency, recorded_at, regions(code)";

export function toHistoryEntry(row: HistoryRow): PriceHistoryEntry {
  return {
    id: row.id,
    gameId: row.game_id,
    regionId: row.region_id,
    regionCode: (row.regions?.code ?? "us") as PriceHistoryEntry["regionCode"],
    price: Number(row.price),
    currency: row.currency,
    recordedAt: row.recorded_at,
  };
}

export async function getHistoryForGame(db: DB, gameId: string, opts?: { regionCode?: string; limit?: number }) {
  let query = db.from("price_history").select(HISTORY_SELECT).eq("game_id", gameId).order("recorded_at", { ascending: true });
  if (opts?.limit) query = query.limit(opts.limit);
  const { data, error } = await query;
  if (error) throw error;
  let rows = (data ?? []) as unknown as HistoryRow[];
  if (opts?.regionCode) rows = rows.filter((r) => r.regions?.code === opts.regionCode);
  return rows.map(toHistoryEntry);
}

/**
 * Only inserts a new history row when the price actually changed from the
 * most recent recorded value for that (game, region) pair - satisfies the
 * "do not insert duplicate history records when price hasn't changed" rule.
 */
export async function insertHistoryIfChanged(db: DB, gameId: string, regionId: string, price: number, currency: string): Promise<boolean> {
  const { data: last, error: lastErr } = await db
    .from("price_history")
    .select("price")
    .eq("game_id", gameId)
    .eq("region_id", regionId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastErr) throw lastErr;

  if (last && Number(last.price) === price) return false;

  const { error } = await db.from("price_history").insert({
    game_id: gameId,
    region_id: regionId,
    price,
    currency,
    recorded_at: new Date().toISOString(),
  });
  if (error) throw error;
  return true;
}

export function computeStats(history: PriceHistoryEntry[], currentPrice: number): PriceStats | null {
  if (history.length === 0) return null;
  const sorted = [...history].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

  let lowest = sorted[0]!;
  let highest = sorted[0]!;
  let sum = 0;
  let timesOnSale = 0;
  let previousPrice: number | null = null;

  for (const entry of sorted) {
    if (entry.price < lowest.price) lowest = entry;
    if (entry.price > highest.price) highest = entry;
    sum += entry.price;
    if (previousPrice !== null && entry.price < previousPrice) timesOnSale += 1;
    previousPrice = entry.price;
  }

  const previous = sorted.length > 1 ? sorted[sorted.length - 2]!.price : currentPrice;
  const priceChange = currentPrice - previous;

  return {
    lowest: lowest.price,
    lowestRecordedAt: lowest.recordedAt,
    highest: highest.price,
    highestRecordedAt: highest.recordedAt,
    average: Math.round((sum / sorted.length) * 100) / 100,
    current: currentPrice,
    priceChange,
    priceChangePercentage: previous > 0 ? Math.round((priceChange / previous) * 1000) / 10 : 0,
    timesOnSale,
  };
}
