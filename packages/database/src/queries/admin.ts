import type { DB } from "../client.js";
import type { AdminStats, UpdateRunResult } from "@pst/types";

export async function getAdminStats(db: DB): Promise<AdminStats> {
  const [{ count: totalGames }, { count: totalPriceRecords }, { count: totalRegions }, { count: gamesOnSale }] = await Promise.all([
    db.from("games").select("*", { count: "exact", head: true }),
    db.from("price_history").select("*", { count: "exact", head: true }),
    db.from("regions").select("*", { count: "exact", head: true }),
    db.from("game_prices").select("*", { count: "exact", head: true }).eq("is_on_sale", true),
  ]);

  const { data: lastSuccess } = await db
    .from("update_runs")
    .select("finished_at")
    .eq("success", true)
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: lastFailed } = await db
    .from("update_runs")
    .select("finished_at, error")
    .eq("success", false)
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    totalGames: totalGames ?? 0,
    totalPriceRecords: totalPriceRecords ?? 0,
    totalRegions: totalRegions ?? 0,
    gamesOnSale: gamesOnSale ?? 0,
    lastSuccessfulUpdate: lastSuccess?.finished_at ?? null,
    lastFailedUpdate: lastFailed ? { at: lastFailed.finished_at ?? "", reason: lastFailed.error ?? "Unknown error" } : null,
  };
}

export async function recordUpdateRun(db: DB, result: UpdateRunResult) {
  const { error } = await db.from("update_runs").insert({
    region_code: result.provider,
    started_at: result.startedAt,
    finished_at: result.finishedAt,
    success: result.success,
    games_processed: result.gamesProcessed,
    prices_changed: result.pricesChanged,
    history_records_inserted: result.historyRecordsInserted,
    error: result.error ?? null,
  });
  if (error) throw error;
}

export async function listRecentUpdateRuns(db: DB, limit = 20) {
  const { data, error } = await db.from("update_runs").select("*").order("started_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}
