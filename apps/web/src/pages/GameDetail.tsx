import { useParams } from "react-router-dom";
import { useApi } from "../hooks/useApi.js";
import { api } from "../lib/api.js";
import { PriceBlock } from "../components/PriceBlock.js";
import { PriceHistoryChart } from "../components/PriceHistoryChart.js";
import { ErrorState } from "../components/States.js";
import { formatPhp } from "@pst/shared";
import { regionFlag, regionName } from "../components/RegionBadge.js";

export default function GameDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: game, loading, error, refetch } = useApi(() => api.games.getBySlug(slug!), [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-content-7xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <div className="skeleton aspect-[3/4] rounded-xl" />
          <div className="space-y-4">
            <div className="skeleton h-8 w-2/3 rounded" />
            <div className="skeleton h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-content-7xl px-4 py-10">
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  if (!game) return null;

  const cheapestPrice = game.prices.find((p) => p.regionCode === game.cheapestRegion);
  const primaryRegion = game.prices[0]?.regionCode;

  return (
    <div className="mx-auto max-w-content-7xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <div className="aspect-[3/4] overflow-hidden rounded-xl border border-surface-border bg-zinc-900">
          {game.coverImage && <img src={game.coverImage} alt={game.title} className="h-full w-full object-cover" />}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{game.platform}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-zinc-50">{game.title}</h1>

          {cheapestPrice && (
            <p className="mt-2 text-sm text-zinc-400">
              Currently cheapest in{" "}
              <span className="font-medium text-zinc-100">
                {regionFlag(cheapestPrice.regionCode)} {regionName(cheapestPrice.regionCode)}
              </span>{" "}
              — {formatPhp(cheapestPrice.phpEquivalent)}
            </p>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {game.prices.map((price) => (
              <PriceBlock key={price.regionId} price={price} cheapest={price.regionCode === game.cheapestRegion} />
            ))}
          </div>

          {game.historicalLowest.overall && (
            <div className="mt-6 rounded-xl border border-surface-border bg-surface-raised p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Historical lowest</p>
              <p className="mt-1 text-lg font-semibold text-zinc-50">
                {regionFlag(game.historicalLowest.overall.regionCode)} {regionName(game.historicalLowest.overall.regionCode)} —{" "}
                {formatPhp(game.historicalLowest.overall.phpEquivalent)}
              </p>
            </div>
          )}
        </div>
      </div>

      <section className="mt-12">
        <h2 className="mb-4 font-display text-xl font-semibold text-zinc-50">Price history</h2>
        {primaryRegion && (
          <PriceHistoryChart
            history={game.priceHistory.filter((h) => h.regionCode === primaryRegion)}
            currency={game.prices.find((p) => p.regionCode === primaryRegion)?.currency ?? "USD"}
          />
        )}
      </section>

      <section className="mt-12">
        <h2 className="mb-4 font-display text-xl font-semibold text-zinc-50">Historical lowest by region</h2>
        <div className="overflow-x-auto rounded-xl border border-surface-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-raised text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">Lowest recorded</th>
                <th className="px-4 py-3">≈ PHP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {game.prices.map((price) => {
                const low = game.historicalLowest.byRegion[price.regionCode];
                return (
                  <tr key={price.regionId}>
                    <td className="px-4 py-3 text-zinc-300">
                      {regionFlag(price.regionCode)} {regionName(price.regionCode)}
                    </td>
                    <td className="px-4 py-3 text-zinc-100">{low ? `${price.currency} ${low.price.toFixed(2)}` : "—"}</td>
                    <td className="px-4 py-3 text-zinc-500">{low ? formatPhp(low.phpEquivalent) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
