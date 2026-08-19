import type { DB } from "../client.js";
import type { RawGamePrice } from "@pst/types";
import { slugify } from "@pst/shared";
import { insertHistoryIfChanged } from "./history.js";

export interface IngestResult {
  gameId: string;
  priceChanged: boolean;
  historyInserted: boolean;
}

/**
 * Normalizes and persists one raw provider record:
 *  1. Upsert the game (matched by title -> slug, since providers don't share a
 *     cross-region id space in the mock/replaceable architecture).
 *  2. Upsert the current price row for (game, region).
 *  3. Insert a price_history row only if the price changed.
 */
export async function ingestRawPrice(db: DB, raw: RawGamePrice, regionIdByCode: Record<string, string>): Promise<IngestResult> {
  const regionId = regionIdByCode[raw.regionCode];
  if (!regionId) throw new Error(`Unknown region code: ${raw.regionCode}`);

  const slug = slugify(raw.title);

  const { data: existingGame, error: findErr } = await db.from("games").select("id").eq("slug", slug).maybeSingle();
  if (findErr) throw findErr;

  let gameId: string;
  if (existingGame) {
    gameId = existingGame.id;
    await db
      .from("games")
      .update({
        cover_image: raw.coverImage,
        store_url: raw.storeUrl,
        platform: raw.platform,
        updated_at: new Date().toISOString(),
      })
      .eq("id", gameId);
  } else {
    const { data: inserted, error: insertErr } = await db
      .from("games")
      .insert({ title: raw.title, slug, platform: raw.platform, cover_image: raw.coverImage, store_url: raw.storeUrl })
      .select("id")
      .single();
    if (insertErr) throw insertErr;
    gameId = inserted.id;
  }

  const discountPercentage =
    raw.salePrice !== null && raw.salePrice < raw.originalPrice
      ? Math.round(((raw.originalPrice - raw.salePrice) / raw.originalPrice) * 100)
      : 0;
  const isOnSale = raw.salePrice !== null && raw.salePrice < raw.originalPrice;
  const effectivePrice = isOnSale ? raw.salePrice! : raw.originalPrice;

  const { data: existingPrice } = await db
    .from("game_prices")
    .select("id, sale_price, original_price")
    .eq("game_id", gameId)
    .eq("region_id", regionId)
    .maybeSingle();

  const priceChanged =
    !existingPrice ||
    Number(existingPrice.original_price) !== raw.originalPrice ||
    Number(existingPrice.sale_price ?? -1) !== (raw.salePrice ?? -1);

  const { error: upsertErr } = await db.from("game_prices").upsert(
    {
      game_id: gameId,
      region_id: regionId,
      original_price: raw.originalPrice,
      sale_price: raw.salePrice,
      discount_percentage: discountPercentage,
      currency: raw.currency,
      sale_start: raw.saleStart,
      sale_end: raw.saleEnd,
      is_on_sale: isOnSale,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "game_id,region_id" },
  );
  if (upsertErr) throw upsertErr;

  const historyInserted = await insertHistoryIfChanged(db, gameId, regionId, effectivePrice, raw.currency);

  return { gameId, priceChanged, historyInserted };
}
