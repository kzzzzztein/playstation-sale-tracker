import { useState } from "react";
import { useApi } from "../hooks/useApi.js";
import { api } from "../lib/api.js";
import { GameCard, GameCardSkeleton } from "../components/GameCard.js";
import { Pagination, SectionHeader } from "../components/Section.js";
import { ErrorState, EmptyState } from "../components/States.js";
import type { RegionCode } from "@pst/types";

const PAGE_SIZE = 24;

function saleEntryToGame(entry: { game: { id: string; title: string; slug: string; coverImage: string | null; platform: string }; price: any }) {
  return {
    ...entry.game,
    platform: entry.game.platform as any,
    createdAt: "",
    updatedAt: "",
    storeUrl: null,
    prices: [entry.price],
    cheapestRegion: entry.price.regionCode as RegionCode,
    cheapestPricePhp: entry.price.phpEquivalent,
  };
}

export default function Sales() {
  const [page, setPage] = useState(1);
  const [region, setRegion] = useState("");
  const { data, loading, error, refetch } = useApi(() => api.sales.current({ page, pageSize: PAGE_SIZE, region: region || undefined }), [page, region]);

  return (
    <div className="mx-auto max-w-content-7xl px-4 py-10">
      <SectionHeader
        title="Current sales"
        action={
          <select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-surface-border bg-surface-raised px-3 py-1.5 text-sm text-zinc-100 focus:border-accent focus:outline-none"
          >
            <option value="">All regions</option>
            <option value="us">United States</option>
            <option value="sg">Singapore</option>
            <option value="hk">Hong Kong</option>
            <option value="tr">Turkey</option>
          </select>
        }
      />

      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => <GameCardSkeleton key={i} />)}
        </div>
      )}
      {error && <ErrorState message={error} onRetry={refetch} />}
      {data && data.data.length === 0 && <EmptyState title="No sales currently tracked" description="Trigger a price update from the admin dashboard." />}
      {data && data.data.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {data.data.map((entry) => <GameCard key={entry.game.id + entry.price.regionCode} game={saleEntryToGame(entry)} />)}
          </div>
          <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
