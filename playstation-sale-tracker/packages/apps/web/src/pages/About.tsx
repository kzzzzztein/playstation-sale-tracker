export default function About() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-display text-3xl font-semibold text-zinc-50">About PS Sale Tracker</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-zinc-400">
        <p>
          PS Sale Tracker is an independent, personal project that tracks PlayStation Store prices across four
          regions (United States, Singapore, Hong Kong, and Turkey) and converts them to Philippine pesos so it's
          easier to see which region offers the best deal on a given title.
        </p>
        <p>
          Prices are stored on a schedule rather than fetched live, so there can be a delay between a change on the
          actual PlayStation Store and what's reflected here. Every price is also kept as a permanent historical
          record, which is what powers the price history charts and "lowest price ever" rankings.
        </p>
        <p>
          PHP conversions are estimates based on the most recently stored exchange rate for each currency. They are
          for comparison only and are not a checkout-accurate quote; actual charges depend on your payment
          provider's own conversion and fees.
        </p>
        <p>
          This project is not affiliated with, endorsed by, or connected to Sony Interactive Entertainment or the
          PlayStation Store in any way.
        </p>
      </div>
    </div>
  );
}
