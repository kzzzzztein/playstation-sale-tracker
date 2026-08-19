import type { GamePriceWithPHP } from "@pst/types";
import { formatCurrency, formatPhp } from "@pst/shared";
import { regionFlag, regionName } from "./RegionBadge.js";

export function PriceBlock({ price, cheapest = false }: { price: GamePriceWithPHP; cheapest?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        cheapest ? "border-accent/60 bg-accent/[0.06]" : "border-surface-border bg-surface-raised"
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
          <span aria-hidden="true">{regionFlag(price.regionCode)}</span>
          {regionName(price.regionCode)}
        </span>
        {cheapest && (
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Cheapest
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        {price.isOnSale && price.salePrice !== null ? (
          <>
            <span className="text-sm text-zinc-500 line-through">{formatCurrency(price.originalPrice, price.currency)}</span>
            <span className="text-lg font-semibold text-zinc-50">{formatCurrency(price.salePrice, price.currency)}</span>
          </>
        ) : (
          <span className="text-lg font-semibold text-zinc-50">{formatCurrency(price.originalPrice, price.currency)}</span>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs text-zinc-500">{formatPhp(price.phpEquivalent)}</span>
        {price.isOnSale && price.discountPercentage > 0 && (
          <span className="rounded bg-discount/15 px-1.5 py-0.5 text-xs font-semibold text-discount">
            -{price.discountPercentage}%
          </span>
        )}
      </div>
    </div>
  );
}
