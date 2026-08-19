import { IRequest } from "itty-router";
import { createServiceClient, getAdminStats, listRegions, listRecentUpdateRuns } from "@pst/database";
import type { Env } from "../env.js";
import { jsonResponse } from "../lib/http.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { runIngestionForAllRegions } from "../services/ingestionRunner.js";
import { refreshExchangeRates } from "../services/refreshRates.js";
import { ALL_REGION_CODES } from "../providers/registry.js";
import { listExchangeRates } from "@pst/database";

export async function handleAdminStats(request: IRequest, env: Env, origin: string) {
  requireAdmin(request, env);
  const db = createServiceClient(env);
  const stats = await getAdminStats(db);
  return jsonResponse(stats, { origin });
}

export async function handleAdminRegions(request: IRequest, env: Env, origin: string) {
  requireAdmin(request, env);
  const db = createServiceClient(env);
  const regions = await listRegions(db);
  return jsonResponse(regions, { origin });
}

export async function handleAdminExchangeRates(request: IRequest, env: Env, origin: string) {
  requireAdmin(request, env);
  const db = createServiceClient(env);
  const rates = await listExchangeRates(db);
  return jsonResponse(rates, { origin });
}

export async function handleAdminRecentRuns(request: IRequest, env: Env, origin: string) {
  requireAdmin(request, env);
  const db = createServiceClient(env);
  const runs = await listRecentUpdateRuns(db, 50);
  return jsonResponse(runs, { origin });
}

/** Manually triggers a full price-update pass across all regions, on demand. */
export async function handleAdminTriggerUpdate(request: IRequest, env: Env, origin: string) {
  requireAdmin(request, env);
  const db = createServiceClient(env);
  const results = await runIngestionForAllRegions(db, ALL_REGION_CODES);
  return jsonResponse({ results }, { origin });
}

/** Manually triggers an exchange-rate refresh. */
export async function handleAdminRefreshRates(request: IRequest, env: Env, origin: string) {
  requireAdmin(request, env);
  const db = createServiceClient(env);
  const result = await refreshExchangeRates(db, env);
  return jsonResponse(result, { origin });
}
