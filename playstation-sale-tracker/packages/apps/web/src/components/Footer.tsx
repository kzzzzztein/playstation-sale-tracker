import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-surface-border">
      <div className="mx-auto max-w-content-7xl px-4 py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div>
            <h4 className="mb-3 text-sm font-semibold text-zinc-200">Browse</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link to="/games" className="hover:text-zinc-200">All Games</Link></li>
              <li><Link to="/sales" className="hover:text-zinc-200">Current Sales</Link></li>
              <li><Link to="/regions" className="hover:text-zinc-200">Regions</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-zinc-200">Rankings</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link to="/sales/biggest-discounts" className="hover:text-zinc-200">Biggest Discounts</Link></li>
              <li><Link to="/sales/lowest-prices" className="hover:text-zinc-200">Lowest Price Ever</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-zinc-200">Project</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link to="/about" className="hover:text-zinc-200">About</Link></li>
              <li><Link to="/admin" className="hover:text-zinc-200">Admin</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-zinc-200">Regions tracked</h4>
            <p className="text-sm text-zinc-500">United States, Singapore, Hong Kong, Turkey</p>
          </div>
        </div>
        <p className="mt-10 text-xs text-zinc-600">
          PS Sale Tracker is an independent, unofficial project. Prices shown may lag behind the live PlayStation
          Store. PHP conversions are estimates based on the latest stored exchange rate, not a payment quote.
        </p>
      </div>
    </footer>
  );
}
