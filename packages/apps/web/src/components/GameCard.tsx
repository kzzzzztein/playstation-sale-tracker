import { Link } from "react-router-dom";
import type { GameWithPrices } from "@pst/types";
import { formatCurrency, formatPhp } from "@pst/shared";
import { regionFlag } from "./RegionBadge.js";

export function GameCard({ game }: { game: GameWithPrices }) {
  const cheapest = game.prices.find((p) => p.regionCode === game.cheapestRegion) ?? game.prices[0];
  const biggestDiscount = game.prices.reduce(
    (max, p) => (p.discountPercentage > max ? p.discountPercentage : max),
    0,
  );

  return (
    <Link
      to={`/games/${game.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-surface-border bg-surface-raised transition-colors hover:border-accent/50"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-900">
        {game.coverImage ? (
          <img
            src={game.coverImage}
            alt={game.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-600">No cover</div>
        )}
        {biggestDiscount > 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-discount px-2 py-1 text-xs font-bold text-black">
            -{biggestDiscount}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-zinc-100">{game.title}</h3>

        {cheapest && (
          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              {cheapest.isOnSale && cheapest.salePrice !== null ? (
                <>
                  <span className="text-xs text-zinc-500 line-through">
                    {formatCurrency(cheapest.originalPrice, cheapest.currency)}
                  </span>
                  <span className="text-sm font-semibold text-zinc-50">
                    {formatCurrency(cheapest.salePrice, cheapest.currency)}
                  </span>
                </>
              ) : (
                <span className="text-sm font-semibold text-zinc-50">
                  {formatCurrency(cheapest.originalPrice, cheapest.currency)}
                </span>
              )}
            </div>
            <span aria-hidden="true" className="text-sm">
              {regionFlag(cheapest.regionCode)}
            </span>
          </div>
        )}
        <span className="text-xs text-zinc-500">{formatPhp(game.cheapestPricePhp)}</span>
      </div>
    </Link>
  );
}

export function GameCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-surface-border bg-surface-raised">
      <div className="skeleton aspect-[3/4] w-full" />
      <div className="space-y-2 p-3">
        <div className="skeleton h-3.5 w-full rounded" />
        <div className="skeleton h-3.5 w-2/3 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}
