import { NavLink, useNavigate } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { GameControllerIcon, ListIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";

const NAV_LINKS = [
  { to: "/games", label: "Games" },
  { to: "/sales", label: "Sales" },
  { to: "/sales/biggest-discounts", label: "Biggest Discounts" },
  { to: "/sales/lowest-prices", label: "Lowest Prices" },
  { to: "/regions", label: "Regions" },
  { to: "/about", label: "About" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault();
    if (query.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setMobileOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-surface-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-content-7xl items-center gap-4 px-4">
        <NavLink to="/" className="flex shrink-0 items-center gap-2 font-display text-lg font-semibold text-zinc-50">
          <GameControllerIcon size={24} weight="fill" className="text-accent" />
          PS Sale Tracker
        </NavLink>

        <nav className="hidden flex-1 items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-surface-raised text-zinc-50" : "text-zinc-400 hover:text-zinc-100"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={onSearchSubmit} className="ml-auto hidden max-w-xs flex-1 items-center lg:flex">
          <div className="flex w-full items-center gap-2 rounded-lg border border-surface-border bg-surface-raised px-3 py-1.5 focus-within:border-accent">
            <MagnifyingGlassIcon size={16} className="text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Search games..."
              className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
          </div>
        </form>

        <NavLink
          to="/admin"
          className="hidden rounded-md border border-surface-border px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100 lg:block"
        >
          Admin
        </NavLink>

        <button
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((v) => !v)}
          className="ml-auto rounded-md p-2 text-zinc-300 lg:hidden"
        >
          {mobileOpen ? <XIcon size={22} /> : <ListIcon size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-surface-border px-4 pb-4 pt-2 lg:hidden">
          <form onSubmit={onSearchSubmit} className="mb-3 flex items-center gap-2 rounded-lg border border-surface-border bg-surface-raised px-3 py-2">
            <MagnifyingGlassIcon size={16} className="text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Search games..."
              className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
          </form>
          <nav className="flex flex-col gap-1">
            {[...NAV_LINKS, { to: "/admin", label: "Admin" }].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium ${isActive ? "bg-surface-raised text-zinc-50" : "text-zinc-400"}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
