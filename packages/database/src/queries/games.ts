import type { DB } from "../client.js";
import type { Game, GamePrice, Region } from "@pst/types";
import { toRegion } from "./regions.js";

export interface GameRow {
  id: string;
  title: string;
  slug: string;
  platform: string;
  cover_image: string | null;
  store_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriceRow {
  id: string;
  game_id: string;
  region_id: string;
  original_price: number;
  sale_price: number | null;
  discount_percentage: number;
  currency: string;
  sale_start: string | null;
  sale_end: string | null;
  is_on_sale: boolean;
  updated_at: string;
  regions: { code: string } | null;
}

export function toGame(row: GameRow): Game {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    platform: row.platform as Game["platform"],
    coverImage: row.cover_image,
    storeUrl: row.store_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toPrice(row: PriceRow): GamePrice {
  return {
    id: row.id,
    gameId: row.game_id,
    regionId: row.region_id,
    regionCode: (row.regions?.code ?? "us") as GamePrice["regionCode"],
    originalPrice: Number(row.original_price),
    salePrice: row.sale_price === null ? null : Number(row.sale_price),
    discountPercentage: row.discount_percentage,
    currency: row.currency,
    saleStart: row.sale_start,
    saleEnd: row.sale_end,
    isOnSale: row.is_on_sale,
    updatedAt: row.updated_at,
  };
}

const PRICE_SELECT = "id, game_id, region_id, original_price, sale_price, discount_percentage, currency, sale_start, sale_end, is_on_sale, updated_at, regions(code)";

export interface ListGamesParams {
  page: number;
  pageSize: number;
  search?: string;
  platform?: string;
  regionCode?: string;
  onSaleOnly?: boolean;
  minDiscount?: number;
  maxPricePhp?: number; // filtering by PHP price requires a joined estimate; see note in service layer
  sort?: "title" | "newest" | "discount" | "price";
}

export async function listGames(db: DB, params: ListGamesParams) {
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  let query = db.from("games").select("*", { count: "exact" });

  if (params.search) {
    query = query.ilike("title", `%${params.search}%`);
  }
  if (params.platform) {
    query = query.ilike("platform", `%${params.platform}%`);
  }
  if (params.sort === "newest") query = query.order("created_at", { ascending: false });
  else query = query.order("title", { ascending: true });

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { games: (data ?? []).map((r) => toGame(r as GameRow)), total: count ?? 0 };
}

export async function getGameBySlug(db: DB, slug: string) {
  const { data, error } = await db.from("games").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? toGame(data as GameRow) : null;
}

export async function getGameById(db: DB, id: string) {
  const { data, error } = await db.from("games").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toGame(data as GameRow) : null;
}

export async function getPricesForGame(db: DB, gameId: string): Promise<GamePrice[]> {
  const { data, error } = await db.from("game_prices").select(PRICE_SELECT).eq("game_id", gameId);
  if (error) throw error;
  return (data ?? []).map((r) => toPrice(r as unknown as PriceRow));
}

export async function getPricesForGames(db: DB, gameIds: string[]): Promise<Record<string, GamePrice[]>> {
  if (gameIds.length === 0) return {};
  const { data, error } = await db.from("game_prices").select(PRICE_SELECT).in("game_id", gameIds);
  if (error) throw error;
  const grouped: Record<string, GamePrice[]> = {};
  for (const row of (data ?? []) as unknown as PriceRow[]) {
    const price = toPrice(row);
    (grouped[price.gameId] ??= []).push(price);
  }
  return grouped;
}

export async function listOnSaleGames(db: DB, opts: { page: number; pageSize: number; minDiscount?: number; regionCode?: string; sort?: "discount" | "endingSoon" }) {
  const from = (opts.page - 1) * opts.pageSize;
  const to = from + opts.pageSize - 1;

  let query = db
    .from("game_prices")
    .select(`${PRICE_SELECT}, games(*)`, { count: "exact" })
    .eq("is_on_sale", true);

  if (opts.minDiscount) query = query.gte("discount_percentage", opts.minDiscount);
  if (opts.regionCode) query = query.eq("regions.code", opts.regionCode);
  if (opts.sort === "endingSoon") query = query.order("sale_end", { ascending: true, nullsFirst: false });
  else query = query.order("discount_percentage", { ascending: false });

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  const rows = (data ?? []) as unknown as (PriceRow & { games: GameRow })[];
  return {
    total: count ?? 0,
    entries: rows.map((r) => ({ game: toGame(r.games), price: toPrice(r) })),
  };
}

export async function searchGames(db: DB, q: string, limit = 20) {
  const { data, error } = await db.from("games").select("*").ilike("title", `%${q}%`).limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => toGame(r as GameRow));
}
