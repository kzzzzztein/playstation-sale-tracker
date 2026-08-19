import type { Game, GamePrice, GamePriceWithPHP, GameWithPrices, RegionCode } from "@pst/types";
import { convertToPhp } from "@pst/shared";

export function enrichPrice(price: GamePrice, rateMap: Record<string, number>): GamePriceWithPHP {
  const rate = rateMap[price.currency] ?? null;
  const effective = price.isOnSale && price.salePrice !== null ? price.salePrice : price.originalPrice;
  return {
    ...price,
    exchangeRateUsed: rate,
    phpEquivalent: convertToPhp(effective, rate),
  };
}

export function attachPrices(game: Game, prices: GamePrice[], rateMap: Record<string, number>): GameWithPrices {
  const enriched = prices.map((p) => enrichPrice(p, rateMap));
  const withPhp = enriched.filter((p): p is GamePriceWithPHP & { phpEquivalent: number } => p.phpEquivalent !== null);
  const cheapest = withPhp.length > 0 ? withPhp.reduce((a, b) => (b.phpEquivalent < a.phpEquivalent ? b : a)) : null;

  return {
    ...game,
    prices: enriched,
    cheapestRegion: cheapest?.regionCode ?? null,
    cheapestPricePhp: cheapest?.phpEquivalent ?? null,
  };
}

export function cheapestRegionAcross(prices: GamePriceWithPHP[]): RegionCode | null {
  const withPhp = prices.filter((p): p is GamePriceWithPHP & { phpEquivalent: number } => p.phpEquivalent !== null);
  if (withPhp.length === 0) return null;
  return withPhp.reduce((a, b) => (b.phpEquivalent < a.phpEquivalent ? b : a)).regionCode;
}
