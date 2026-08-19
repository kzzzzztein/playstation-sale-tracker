import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApi } from "../hooks/useApi.js";
import { api } from "../lib/api.js";
import { GameCard, GameCardSkeleton } from "../components/GameCard.js";
import { Pagination, SectionHeader } from "../components/Section.js";
import { ErrorState, EmptyState } from "../components/States.js";

const PAGE_SIZE = 24;

export default function Games() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") ?? "1");
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [platform, setPlatform] = useState(params.get("platform") ?? "");
  const [sort, setSort] = useState<"title" | "newest">((params.get("sort") as "title" | "newest") ?? "title");

  const { data, loading, error, refetch } = useApi(
    () => api.games.list({ page, pageSize: PAGE_SIZE, q: search || undefined, platform: platform || undefined, sort }),
    [page, search, platform, sort],
  );

  function applyFilters() {
    setParams({ page: "1", q: search, platform, sort });
  }

  return (
    <div className="mx-auto max-w-content-7xl px-4 py-10">
      <SectionHeader title="All games" />

      <div className="mb-6 flex flex-wrap gap-3 rounded-xl border border-surface-border bg-surface-raised p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          placeholder="Search by title..."
          className="min-w-[200px] flex-1 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-accent focus:outline-none"
        />
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-zinc-100 focus:border-accent focus:outline-none"
        >
          <option value="">All platforms</option>
          <option value="PS5">PS5</option>
          <option value="PS4">PS4</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "title" | "newest")}
          className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-zinc-100 focus:border-accent focus:outline-none"
        >
          <option value="title">Sort: Title</option>
          <option value="newest">Sort: Newest</option>
        </select>
        <button onClick={applyFilters} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dim">
          Apply
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => <GameCardSkeleton key={i} />)}
        </div>
      )}
      {error && <ErrorState message={error} onRetry={refetch} />}
      {data && data.data.length === 0 && <EmptyState title="No games match your filters" description="Try a different search term or clear filters." />}
      {data && data.data.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {data.data.map((game) => <GameCard key={game.id} game={game} />)}
          </div>
          <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={(p) => setParams({ page: String(p), q: search, platform, sort })} />
        </>
      )}
    </div>
  );
}
