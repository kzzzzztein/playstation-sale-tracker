import { useState } from "react";
import { useApi } from "../hooks/useApi.js";
import { api } from "../lib/api.js";
import { SectionHeader } from "../components/Section.js";
import { ErrorState, EmptyState } from "../components/States.js";
import { formatCurrency, formatPhp } from "@pst/shared";
import { regionFlag, regionName } from "../components/RegionBadge.js";
import { Link } from "react-router-dom";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";

export default function Regions() {
  const { data: regions } = useApi(() => api.regions.list(), []);
  const [query, setQuery] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");

  const { data, loading, error, refetch } = useApi(
    () => (committedQuery ? api.search(committedQuery) : Promise.resolve({ query: "", results: [] })),
    [committedQuery],
  );

  return (
    <div className="mx-auto max-w-content-7xl px-4 py-10">
      <SectionHeader title="Regional price comparison" />

      {regions && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {regions.map((r) => (
            <div key={r.id} className="rounded-xl border border-surface-border bg-surface-raised p-4">
              <p className="text-2xl">{r.flagEmoji}</p>
              <p className="mt-1 text-sm font-medium text-zinc-100">{r.name}</p>
              <p className="text-xs text-zinc-500">{r.currency}</p>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setCommittedQuery(query.trim());
        }}
        className="mb-6 flex items-center gap-2 rounded-lg border border-surface-border bg-surface-raised px-3 py-2"
      >
        <MagnifyingGlassIcon size={16} className="text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a game to compare prices across regions..."
          className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
        />
      </form>

      {loading && committedQuery && <div className="skeleton h-40 rounded-xl" />}
      {error && <ErrorState message={error} onRetry={refetch} />}
      {data && committedQuery && data.results.length === 0 && <EmptyState title={`No games found for "${committedQuery}"`} />}

      {data && data.results.length > 0 && (
        <div className="space-y-8">
          {data.results.map((game) => (
            <div key={game.id} className="rounded-xl border border-surface-border">
              <Link to={`/games/${game.slug}`} className="block px-4 py-3 text-sm font-medium text-zinc-100 hover:text-accent-soft">
                {game.title}
              </Link>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-raised text-left text-xs uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="px-4 py-2">Region</th>
                      <th className="px-4 py-2">Original</th>
                      <th className="px-4 py-2">Sale</th>
                      <th className="px-4 py-2">Discount</th>
                      <th className="px-4 py-2">≈ PHP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {game.prices.map((price) => (
                      <tr key={price.regionId} className={price.regionCode === game.cheapestRegion ? "bg-accent/[0.06]" : undefined}>
                        <td className="px-4 py-2.5 text-zinc-300">
                          {regionFlag(price.regionCode)} {regionName(price.regionCode)}
                          {price.regionCode === game.cheapestRegion && (
                            <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-white">CHEAPEST</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-zinc-400">{formatCurrency(price.originalPrice, price.currency)}</td>
                        <td className="px-4 py-2.5 text-zinc-100">
                          {price.salePrice !== null ? formatCurrency(price.salePrice, price.currency) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-discount">{price.discountPercentage > 0 ? `-${price.discountPercentage}%` : "—"}</td>
                        <td className="px-4 py-2.5 text-zinc-500">{formatPhp(price.phpEquivalent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
