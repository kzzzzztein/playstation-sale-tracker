import { IRequest } from "itty-router";
import { createServiceClient, listOnSaleGames, getRateMap, getHistoryForGame } from "@pst/database";
import { clampInt } from "@pst/shared";
import type { Env } from "../env.js";
import { jsonResponse } from "../lib/http.js";
import { enrichPrice } from "../services/enrich.js";
import type { PaginatedResponse } from "@pst/types";

interface SaleEntryResponse {
  game: ReturnType<typeof structureGame>;
  price: ReturnType<typeof enrichPrice>;
}

function structureGame(g: { id: string; title: string; slug: string; coverImage: string | null; platform: string }) {
  return { id: g.id, title: g.title, slug: g.slug, coverImage: g.coverImage, platform: g.platform };
}

export async function handleCurrentSales(request: IRequest, env: Env, origin: string) {
  const url = new URL(request.url);
  const db = createServiceClient(env);
  const page = clampInt(url.searchParams.get("page"), 1, 1, 10_000);
  const pageSize = clampInt(url.searchParams.get("pageSize"), 24, 1, 100);
  const region = url.searchParams.get("region") ?? undefined;
  const minDiscount = url.searchParams.get("minDiscount") ? clampInt(url.searchParams.get("minDiscount"), 0, 0, 100) : undefined;

  const [{ entries, total }, rateMap] = await Promise.all([
    listOnSaleGames(db, { page, pageSize, minDiscount, regionCode: region, sort: "discount" }),
    getRateMap(db),
  ]);

  const data: SaleEntryResponse[] = entries.map((e) => ({ game: structureGame(e.game), price: enrichPrice(e.price, rateMap) }));

  const body: PaginatedResponse<SaleEntryResponse> = {
    data,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
  return jsonResponse(body, { origin });
}

export async function handleBiggestDiscounts(request: IRequest, env: Env, origin: string) {
  const url = new URL(request.url);
  const db = createServiceClient(env);
  const page = clampInt(url.searchParams.get("page"), 1, 1, 10_000);
  const pageSize = clampInt(url.searchParams.get("pageSize"), 24, 1, 100);

  const [{ entries, total }, rateMap] = await Promise.all([
    listOnSaleGames(db, { page, pageSize, sort: "discount" }),
    getRateMap(db),
  ]);

  const data: SaleEntryResponse[] = entries.map((e) => ({ game: structureGame(e.game), price: enrichPrice(e.price, rateMap) }));
  const body: PaginatedResponse<SaleEntryResponse> = {
    data,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
  return jsonResponse(body, { origin });
}

export async function handleLowestPrices(request: IRequest, env: Env, origin: string) {
  const url = new URL(request.url);
  const db = createServiceClient(env);
  const page = clampInt(url.searchParams.get("page"), 1, 1, 10_000);
  const pageSize = clampInt(url.searchParams.get("pageSize"), 24, 1, 100);

  const [{ entries, total }, rateMap] = await Promise.all([
    listOnSaleGames(db, { page, pageSize, sort: "discount" }),
    getRateMap(db),
  ]);

  // "Lowest price ever" = current price is at or within 5% of the all-time
  // recorded low for that (game, region) pair.
  const results = await Promise.all(
    entries.map(async (e) => {
      const history = await getHistoryForGame(db, e.game.id, { regionCode: e.price.regionCode });
      if (history.length === 0) return null;
      const lowest = history.reduce((a, b) => (b.price < a.price ? b : a));
      const currentEffective = e.price.isOnSale && e.price.salePrice !== null ? e.price.salePrice : e.price.originalPrice;
      const withinThreshold = currentEffective <= lowest.price * 1.05;
      if (!withinThreshold) return null;
      const percentAboveLow = lowest.price > 0 ? Math.round(((currentEffective - lowest.price) / lowest.price) * 1000) / 10 : 0;
      return {
        game: structureGame(e.game),
        price: enrichPrice(e.price, rateMap),
        historicalLow: lowest.price,
        percentAboveHistoricalLow: percentAboveLow,
      };
    }),
  );

  const filtered = results.filter((r): r is NonNullable<typeof r> => r !== null);

  const body: PaginatedResponse<(typeof filtered)[number]> = {
    data: filtered,
    pagination: { page, pageSize, total: filtered.length, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
  return jsonResponse(body, { origin });
}
