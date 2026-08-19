import { IRequest } from "itty-router";
import { createServiceClient, searchGames, getPricesForGames, getRateMap } from "@pst/database";
import type { Env } from "../env.js";
import { badRequest, jsonResponse } from "../lib/http.js";
import { attachPrices } from "../services/enrich.js";

export async function handleSearch(request: IRequest, env: Env, origin: string) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  if (!q || q.length < 2) throw badRequest("Query parameter 'q' must be at least 2 characters.");

  const db = createServiceClient(env);
  const [games, rateMap] = await Promise.all([searchGames(db, q, 20), getRateMap(db)]);
  const pricesByGame = await getPricesForGames(db, games.map((g) => g.id));
  const data = games.map((g) => attachPrices(g, pricesByGame[g.id] ?? [], rateMap));

  return jsonResponse({ query: q, results: data }, { origin });
}
