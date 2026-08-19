import { IRequest } from "itty-router";
import { createServiceClient } from "@pst/database";
import { getGameBySlug, getGameById, getPricesForGame, getPricesForGames, listGames } from "@pst/database";
import { getHistoryForGame, computeStats } from "@pst/database";
import { getRateMap } from "@pst/database";
import { clampInt } from "@pst/shared";
import type { Env } from "../env.js";
import { badRequest, jsonResponse, notFound } from "../lib/http.js";
import { attachPrices, enrichPrice } from "../services/enrich.js";
import type { GameDetail, PaginatedResponse, GameWithPrices } from "@pst/types";

export async function handleListGames(request: IRequest, env: Env, origin: string) {
  const url = new URL(request.url);
  const db = createServiceClient(env);

  const page = clampInt(url.searchParams.get("page"), 1, 1, 10_000);
  const pageSize = clampInt(url.searchParams.get("pageSize"), 24, 1, 100);
  const search = url.searchParams.get("q") ?? undefined;
  const platform = url.searchParams.get("platform") ?? undefined;
  const sort = (url.searchParams.get("sort") as "title" | "newest" | null) ?? undefined;

  const [{ games, total }, rateMap] = await Promise.all([
    listGames(db, { page, pageSize, search, platform, sort: sort ?? undefined }),
    getRateMap(db),
  ]);

  const pricesByGame = await getPricesForGames(db, games.map((g) => g.id));

  const data: GameWithPrices[] = games.map((g) => attachPrices(g, pricesByGame[g.id] ?? [], rateMap));

  const body: PaginatedResponse<GameWithPrices> = {
    data,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
  return jsonResponse(body, { origin });
}

export async function handleGetGameBySlug(request: IRequest, env: Env, origin: string) {
  const slug = request.params?.slug;
  if (!slug) throw badRequest("Missing game slug");

  const db = createServiceClient(env);
  const game = await getGameBySlug(db, slug);
  if (!game) throw notFound(`No game found with slug "${slug}"`);

  const [prices, rateMap, history] = await Promise.all([
    getPricesForGame(db, game.id),
    getRateMap(db),
    getHistoryForGame(db, game.id),
  ]);

  const enrichedPrices = prices.map((p) => enrichPrice(p, rateMap));
  const withPrices = attachPrices(game, prices, rateMap);

  const byRegion: GameDetail["historicalLowest"]["byRegion"] = {} as GameDetail["historicalLowest"]["byRegion"];
  let overallLowest: GameDetail["historicalLowest"]["overall"] = null;

  for (const price of enrichedPrices) {
    const regionHistory = history.filter((h) => h.regionCode === price.regionCode);
    if (regionHistory.length === 0) continue;
    const lowestEntry = regionHistory.reduce((a, b) => (b.price < a.price ? b : a));
    const rate = rateMap[lowestEntry.currency] ?? null;
    const phpEquivalent = rate ? Math.round(lowestEntry.price * rate * 100) / 100 : null;
    byRegion[price.regionCode] = { price: lowestEntry.price, phpEquivalent };
    if (!overallLowest || (phpEquivalent !== null && (overallLowest.phpEquivalent === null || phpEquivalent < overallLowest.phpEquivalent))) {
      overallLowest = { regionCode: price.regionCode, price: lowestEntry.price, phpEquivalent };
    }
  }

  const detail: GameDetail = {
    ...withPrices,
    historicalLowest: { overall: overallLowest, byRegion },
    priceHistory: history,
  };

  return jsonResponse(detail, { origin });
}

export async function handleGetGamePrices(request: IRequest, env: Env, origin: string) {
  const id = request.params?.id;
  if (!id) throw badRequest("Missing game id");
  const db = createServiceClient(env);
  const game = await getGameById(db, id);
  if (!game) throw notFound("Game not found");
  const [prices, rateMap] = await Promise.all([getPricesForGame(db, id), getRateMap(db)]);
  return jsonResponse(prices.map((p) => enrichPrice(p, rateMap)), { origin });
}

export async function handleGetGameHistory(request: IRequest, env: Env, origin: string) {
  const id = request.params?.id;
  if (!id) throw badRequest("Missing game id");
  const url = new URL(request.url);
  const regionCode = url.searchParams.get("region") ?? undefined;

  const db = createServiceClient(env);
  const game = await getGameById(db, id);
  if (!game) throw notFound("Game not found");

  const history = await getHistoryForGame(db, id, { regionCode });
  const prices = await getPricesForGame(db, id);
  const currentForRegion = regionCode ? prices.find((p) => p.regionCode === regionCode) : undefined;
  const current = currentForRegion ? (currentForRegion.isOnSale ? currentForRegion.salePrice! : currentForRegion.originalPrice) : undefined;

  const stats = current !== undefined ? computeStats(history, current) : null;

  return jsonResponse({ history, stats }, { origin });
}
