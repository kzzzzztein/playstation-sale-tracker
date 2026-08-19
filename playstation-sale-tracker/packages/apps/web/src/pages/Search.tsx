import { useSearchParams } from "react-router-dom";
import { useApi } from "../hooks/useApi.js";
import { api } from "../lib/api.js";
import { GameCard, GameCardSkeleton } from "../components/GameCard.js";
import { SectionHeader } from "../components/Section.js";
import { ErrorState, EmptyState } from "../components/States.js";

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";

  const { data, loading, error, refetch } = useApi(() => (q.length >= 2 ? api.search(q) : Promise.resolve({ query: q, results: [] })), [q]);

  return (
    <div className="mx-auto max-w-content-7xl px-4 py-10">
      <SectionHeader title={q ? `Results for "${q}"` : "Search"} />

      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <GameCardSkeleton key={i} />)}
        </div>
      )}
      {error && <ErrorState message={error} onRetry={refetch} />}
      {data && q && data.results.length === 0 && <EmptyState title={`No games found for "${q}"`} description="Try a shorter or different search term." />}
      {data && data.results.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {data.results.map((game) => <GameCard key={game.id} game={game} />)}
        </div>
      )}
    </div>
  );
}
