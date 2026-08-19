import { useState } from "react";
import { api, ApiClientError } from "../lib/api.js";
import type { AdminStats } from "@pst/types";
import { ArrowsClockwiseIcon, CurrencyCircleDollarIcon, DatabaseIcon, GameControllerIcon, WarningCircleIcon } from "@phosphor-icons/react";

const TOKEN_STORAGE_KEY = "pst_admin_token";

export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_STORAGE_KEY) ?? "");
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await api.admin.stats(token);
      setStats(result);
      setAuthed(true);
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshStats() {
    try {
      setStats(await api.admin.stats(token));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to refresh stats.");
    }
  }

  async function triggerUpdate() {
    setBusy(true);
    setActionLog((log) => [`Started price update at ${new Date().toLocaleTimeString()}...`, ...log]);
    try {
      const { results } = await api.admin.triggerUpdate(token);
      const summary = results
        .map((r) => `${r.provider.toUpperCase()}: ${r.success ? `OK - ${r.gamesProcessed} games, ${r.historyRecordsInserted} history rows` : `FAILED - ${r.error}`}`)
        .join(" | ");
      setActionLog((log) => [summary, ...log]);
      await refreshStats();
    } catch (err) {
      setActionLog((log) => [`Error: ${err instanceof ApiClientError ? err.message : "Unknown error"}`, ...log]);
    } finally {
      setBusy(false);
    }
  }

  async function refreshRates() {
    setBusy(true);
    try {
      const result = await api.admin.refreshRates(token);
      setActionLog((log) => [`Exchange rates refreshed via ${result.provider} (${result.currencies.join(", ")})`, ...log]);
    } catch (err) {
      setActionLog((log) => [`Error: ${err instanceof ApiClientError ? err.message : "Unknown error"}`, ...log]);
    } finally {
      setBusy(false);
    }
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-sm px-4 py-20">
        <h1 className="font-display text-2xl font-semibold text-zinc-50">Admin access</h1>
        <p className="mt-2 text-sm text-zinc-500">Enter the admin token configured as the ADMIN_API_TOKEN Worker secret.</p>
        <form onSubmit={signIn} className="mt-6 space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Admin token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm text-zinc-100 focus:border-accent focus:outline-none"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Checking..." : "Sign in"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-content-7xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-zinc-50">Admin dashboard</h1>
        <button
          onClick={() => {
            sessionStorage.removeItem(TOKEN_STORAGE_KEY);
            setAuthed(false);
            setToken("");
          }}
          className="text-sm text-zinc-500 hover:text-zinc-200"
        >
          Sign out
        </button>
      </div>

      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={<GameControllerIcon size={20} />} label="Tracked games" value={stats.totalGames} />
          <StatCard icon={<DatabaseIcon size={20} />} label="Price records" value={stats.totalPriceRecords} />
          <StatCard icon={<CurrencyCircleDollarIcon size={20} />} label="Games on sale" value={stats.gamesOnSale} />
          <StatCard icon={<ArrowsClockwiseIcon size={20} />} label="Regions" value={stats.totalRegions} />
        </div>
      )}

      {stats && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Last successful update</p>
            <p className="mt-1 text-sm text-zinc-200">
              {stats.lastSuccessfulUpdate ? new Date(stats.lastSuccessfulUpdate).toLocaleString() : "Never"}
            </p>
          </div>
          <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Last failed update</p>
            {stats.lastFailedUpdate ? (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-red-300">
                <WarningCircleIcon size={16} /> {new Date(stats.lastFailedUpdate.at).toLocaleString()} — {stats.lastFailedUpdate.reason}
              </p>
            ) : (
              <p className="mt-1 text-sm text-zinc-200">None recorded</p>
            )}
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-wrap gap-3">
        <button
          onClick={triggerUpdate}
          disabled={busy}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Working..." : "Trigger price update now"}
        </button>
        <button
          onClick={refreshRates}
          disabled={busy}
          className="rounded-lg border border-surface-border px-4 py-2 text-sm font-semibold text-zinc-200 disabled:opacity-50"
        >
          Refresh exchange rates
        </button>
        <button onClick={refreshStats} className="rounded-lg border border-surface-border px-4 py-2 text-sm font-semibold text-zinc-200">
          Refresh stats
        </button>
      </div>

      {actionLog.length > 0 && (
        <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Activity log</p>
          <ul className="space-y-1.5 font-mono text-xs text-zinc-400">
            {actionLog.map((line, i) => <li key={i}>{line}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
      <div className="mb-2 text-accent-soft">{icon}</div>
      <p className="text-2xl font-semibold text-zinc-50">{value.toLocaleString()}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}
