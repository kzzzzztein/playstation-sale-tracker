import type { DB } from "@pst/database";
import { ingestRawPrice, listRegions, recordUpdateRun } from "@pst/database";
import type { RegionCode, UpdateRunResult } from "@pst/types";
import { getProvider } from "../providers/registry.js";

/**
 * Runs one full ingestion pass for a single region:
 *   Cron Trigger -> Price Provider -> Normalize -> Compare -> Insert history -> Update current price
 * Mirrors the pipeline described in the project spec. Every step is logged
 * to `update_runs` so the admin dashboard can show last success/failure.
 */
export async function runIngestionForRegion(db: DB, regionCode: RegionCode): Promise<UpdateRunResult> {
  const startedAt = new Date().toISOString();
  const provider = getProvider(regionCode);

  const regionRows = await listRegions(db);
  const regionIdByCode = Object.fromEntries(regionRows.map((r) => [r.code, r.id]));

  try {
    const rawPrices = await provider.getGames();

    let pricesChanged = 0;
    let historyInserted = 0;

    for (const raw of rawPrices) {
      const result = await ingestRawPrice(db, raw, regionIdByCode);
      if (result.priceChanged) pricesChanged += 1;
      if (result.historyInserted) historyInserted += 1;
    }

    const finishedAt = new Date().toISOString();
    const runResult: UpdateRunResult = {
      provider: regionCode,
      startedAt,
      finishedAt,
      success: true,
      gamesProcessed: rawPrices.length,
      pricesChanged,
      historyRecordsInserted: historyInserted,
    };
    await recordUpdateRun(db, runResult);
    return runResult;
  } catch (err) {
    const finishedAt = new Date().toISOString();
    const runResult: UpdateRunResult = {
      provider: regionCode,
      startedAt,
      finishedAt,
      success: false,
      gamesProcessed: 0,
      pricesChanged: 0,
      historyRecordsInserted: 0,
      error: err instanceof Error ? err.message : String(err),
    };
    await recordUpdateRun(db, runResult);
    return runResult;
  }
}

export async function runIngestionForAllRegions(db: DB, regionCodes: RegionCode[]): Promise<UpdateRunResult[]> {
  const results: UpdateRunResult[] = [];
  for (const code of regionCodes) {
    // Sequential on purpose: keeps Worker CPU/time bounded on the free tier
    // and avoids hammering Supabase with parallel upserts on the same rows.
    results.push(await runIngestionForRegion(db, code));
  }
  return results;
}
