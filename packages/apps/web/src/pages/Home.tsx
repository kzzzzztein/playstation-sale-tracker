import { useApi } from "../hooks/useApi.js";
import { api } from "../lib/api.js";
import { GameCard, GameCardSkeleton } from "../components/GameCard.js";
import { SectionHeader } from "../components/Section.js";
import { ErrorState, EmptyState } from "../components/States.js";
import { Link } from "react-router-dom";
import { TagIcon } from "@phosphor-icons/react";

export default function Home() {
  const featured = useApi(() => api.games.list({ page: 1, pageSize: 12, sort: "newest" }), []);
  const discounts = useApi(() => api.sales.biggestDiscounts({ page: 1, pageSize: 6 }), []);

  return (
    <div className="mx-auto max-w-content-7xl px-4 py-10">
      <section className="mb-14 rounded-2xl border border-surface-border bg-surface-raised px-6 py-14 text-center sm:px-12">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent-soft">
          <TagIcon size={14} weight="fill" /> Tracking 4 PlayStation Store regions
        </span>
        <h1 className="mx-auto max-w-2xl font-display text-4xl font-semibold leading-tight text-zinc-50 sm:text-5xl">
          Find the cheapest region before you buy.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-zinc-400">
          Compare current PlayStation Store prices across US, Singapore, Hong Kong, and Turkey, converted to PHP,
          with full price history for every title.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Link to="/sales" className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dim">
            Browse current sales
          </Link>
          <Link to="/regions" className="rounded-lg border border-surface-border px-5 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-white/5">
            Compare regions
          </Link>
        </div>
      </section>

      <section className="mb-14">
        <SectionHeader title="Biggest discounts right now" action={<Link to="/sales/biggest-discounts" className="text-sm text-accent-soft hover:underline">View all</Link>} />
        {discounts.loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => <GameCardSkeleton key={i} />)}
          </div>
        )}
        {discounts.error && <ErrorState message={discounts.error} onRetry={discounts.refetch} />}
        {discounts.data && discounts.data.data.length === 0 && (
          <EmptyState title="No sales tracked yet" description="Run a price update from the admin dashboard to populate this section." />
        )}
        {discounts.data && discounts.data.data.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {discounts.data.data.map((entry) => (
              <GameCard
                key={entry.game.id}
                game={{
                  ...entry.game,
                  createdAt: "",
                  updatedAt: "",
                  storeUrl: null,
                  prices: [entry.price],
                  cheapestRegion: entry.price.regionCode,
                  cheapestPricePhp: entry.price.phpEquivalent,
                }}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Recently added" action={<Link to="/games" className="text-sm text-accent-soft hover:underline">View all games</Link>} />
        {featured.loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => <GameCardSkeleton key={i} />)}
          </div>
        )}
        {featured.error && <ErrorState message={featured.error} onRetry={featured.refetch} />}
        {featured.data && featured.data.data.length === 0 && (
          <EmptyState title="No games tracked yet" description="Trigger a price update from the admin dashboard to pull in mock catalog data." />
        )}
        {featured.data && featured.data.data.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {featured.data.data.map((game) => <GameCard key={game.id} game={game} />)}
          </div>
        )}
      </section>
    </div>
  );
}
