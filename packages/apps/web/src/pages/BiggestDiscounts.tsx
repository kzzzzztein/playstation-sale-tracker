import { useState } from "react";
import { useApi } from "../hooks/useApi.js";
import { api } from "../lib/api.js";
import { Pagination, SectionHeader } from "../components/Section.js";
import { ErrorState, EmptyState } from "../components/States.js";
import { Link } from "react-router-dom";
import { formatCurrency, formatPhp } from "@pst/shared";
import { regionFlag } from "../components/RegionBadge.js";

const PAGE_SIZE = 20;

export default function BiggestDiscounts() {
  const [page, setPage] = useState(1);
  const { data, loading, error, refetch } = useApi(() => api.sales.biggestDiscounts({ page, pageSize: PAGE_SIZE }), [page]);

  return (
    <div className="mx-auto max-w-content-7xl px-4 py-10">
      <SectionHeader title="Biggest discounts" />

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      )}
      {error && <ErrorState message={error} onRetry={refetch} />}
      {data && data.data.length === 0 && <EmptyState title="No discounted games yet" />}

      {data && data.data.length > 0 && (
        <>
          <ol className="divide-y divide-surface-border rounded-xl border border-surface-border">
            {data.data.map((entry, i) => (
              <li key={entry.game.id + entry.price.regionCode}>
                <Link to={`/games/${entry.game.slug}`} className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-surface-raised">
                  <span className="w-8 text-center font-mono text-sm text-zinc-500">{(page - 1) * PAGE_SIZE + i + 1}</span>
                  <div className="h-14 w-11 shrink-0 overflow-hidden rounded bg-zinc-900">
                    {entry.game.coverImage && <img src={entry.game.coverImage} alt="" className="h-full w-full object-cover" loading="lazy" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-100">{entry.game.title}</p>
                    <p className="text-xs text-zinc-500">
                      {regionFlag(entry.price.regionCode)} {formatCurrency(entry.price.originalPrice, entry.price.currency)}
                      {entry.price.salePrice !== null && <> → {formatCurrency(entry.price.salePrice, entry.price.currency)}</>}
                      {" · "}
                      {formatPhp(entry.price.phpEquivalent)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-discount/15 px-2.5 py-1 text-sm font-bold text-discount">
                    -{entry.price.discountPercentage}%
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
