import { Router, IRequest } from "itty-router";
import type { Env } from "./env.js";
import { errorResponse, jsonResponse } from "./lib/http.js";
import { handleListGames, handleGetGameBySlug, handleGetGamePrices, handleGetGameHistory } from "./routes/games.js";
import { handleCurrentSales, handleBiggestDiscounts, handleLowestPrices } from "./routes/sales.js";
import { handleListRegions, handleListExchangeRates } from "./routes/regions.js";
import { handleSearch } from "./routes/search.js";
import {
  handleAdminStats,
  handleAdminRegions,
  handleAdminExchangeRates,
  handleAdminRecentRuns,
  handleAdminTriggerUpdate,
  handleAdminRefreshRates,
} from "./routes/admin.js";
import { createServiceClient } from "@pst/database";
import { runIngestionForAllRegions } from "./services/ingestionRunner.js";
import { refreshExchangeRates } from "./services/refreshRates.js";
import { ALL_REGION_CODES } from "./providers/registry.js";

const router = Router();

type Handler = (request: IRequest, env: Env, origin: string) => Promise<Response>;

/** Wraps a handler so every route shares consistent error handling + CORS. */
function h(fn: Handler) {
  return async (request: IRequest, env: Env) => {
    const origin = env.CORS_ALLOWED_ORIGIN || "*";
    try {
      return await fn(request, env, origin);
    } catch (err) {
      return errorResponse(err, origin);
    }
  };
}

router.get("/api/games", h(handleListGames));
router.get("/api/games/:slug", h(handleGetGameBySlug));
router.get("/api/games/:id/prices", h(handleGetGamePrices));
router.get("/api/games/:id/history", h(handleGetGameHistory));

router.get("/api/sales", h(handleCurrentSales));
router.get("/api/sales/biggest-discounts", h(handleBiggestDiscounts));
router.get("/api/sales/lowest-prices", h(handleLowestPrices));

router.get("/api/regions", h(handleListRegions));
router.get("/api/exchange-rates", h(handleListExchangeRates));
router.get("/api/search", h(handleSearch));

router.get("/api/admin/stats", h(handleAdminStats));
router.get("/api/admin/regions", h(handleAdminRegions));
router.get("/api/admin/exchange-rates", h(handleAdminExchangeRates));
router.get("/api/admin/update-runs", h(handleAdminRecentRuns));
router.post("/api/admin/trigger-update", h(handleAdminTriggerUpdate));
router.post("/api/admin/refresh-rates", h(handleAdminRefreshRates));

router.get("/api/health", async (_request, env: Env) =>
  jsonResponse({ status: "ok", environment: env.ENVIRONMENT }, { origin: env.CORS_ALLOWED_ORIGIN || "*" }),
);

router.all("*", (_request, env: Env) =>
  errorResponse(new Error("Not found"), env.CORS_ALLOWED_ORIGIN || "*"),
);

function corsPreflight(env: Env): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": env.CORS_ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") return corsPreflight(env);
    return router.handle(request, env);
  },

  /**
   * Scheduled handler wired to the cron trigger in wrangler.toml.
   * Pipeline: Cron -> Price Provider -> Normalize -> Compare -> Insert
   * history -> Update current price (see services/ingestionRunner.ts).
   */
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runScheduledJob(env));
  },
};

async function runScheduledJob(env: Env): Promise<void> {
  const db = createServiceClient(env);
  try {
    await refreshExchangeRates(db, env);
  } catch (err) {
    console.error("Exchange rate refresh failed:", err);
  }
  await runIngestionForAllRegions(db, ALL_REGION_CODES);
}
