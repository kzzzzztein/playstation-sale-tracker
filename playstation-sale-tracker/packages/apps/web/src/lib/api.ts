import type {
  AdminStats,
  ExchangeRate,
  GameDetail,
  GameWithPrices,
  PaginatedResponse,
  PriceHistoryEntry,
  PriceStats,
  Region,
  UpdateRunResult,
} from "@pst/types";

// The frontend NEVER holds Supabase credentials. Every request goes through
// the Cloudflare Worker, configured via this base URL.
const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

export class ApiClientError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body?.error?.message ?? `Request failed with status ${res.status}`;
    const code = body?.error?.code ?? "UNKNOWN_ERROR";
    throw new ApiClientError(res.status, code, message);
  }
  return res.json() as Promise<T>;
}

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") usp.set(key, String(value));
  }
  const str = usp.toString();
  return str ? `?${str}` : "";
}

export interface ListGamesOptions {
  page?: number;
  pageSize?: number;
  q?: string;
  platform?: string;
  sort?: "title" | "newest";
}

export interface SaleEntry {
  game: { id: string; title: string; slug: string; coverImage: string | null; platform: string };
  price: GameWithPrices["prices"][number];
}

export interface LowestPriceEntry extends SaleEntry {
  historicalLow: number;
  percentAboveHistoricalLow: number;
}

export const api = {
  games: {
    list: (opts: ListGamesOptions = {}) => request<PaginatedResponse<GameWithPrices>>(`/api/games${qs(opts)}`),
    getBySlug: (slug: string) => request<GameDetail>(`/api/games/${encodeURIComponent(slug)}`),
    history: (id: string, region?: string) =>
      request<{ history: PriceHistoryEntry[]; stats: PriceStats | null }>(`/api/games/${id}/history${qs({ region })}`),
  },
  sales: {
    current: (opts: { page?: number; pageSize?: number; region?: string; minDiscount?: number } = {}) =>
      request<PaginatedResponse<SaleEntry>>(`/api/sales${qs(opts)}`),
    biggestDiscounts: (opts: { page?: number; pageSize?: number } = {}) =>
      request<PaginatedResponse<SaleEntry>>(`/api/sales/biggest-discounts${qs(opts)}`),
    lowestPrices: (opts: { page?: number; pageSize?: number } = {}) =>
      request<PaginatedResponse<LowestPriceEntry>>(`/api/sales/lowest-prices${qs(opts)}`),
  },
  regions: {
    list: () => request<Region[]>("/api/regions"),
  },
  exchangeRates: {
    list: () => request<ExchangeRate[]>("/api/exchange-rates"),
  },
  search: (q: string) => request<{ query: string; results: GameWithPrices[] }>(`/api/search${qs({ q })}`),
  admin: {
    stats: (token: string) => request<AdminStats>("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } }),
    regions: (token: string) => request<Region[]>("/api/admin/regions", { headers: { Authorization: `Bearer ${token}` } }),
    exchangeRates: (token: string) => request<ExchangeRate[]>("/api/admin/exchange-rates", { headers: { Authorization: `Bearer ${token}` } }),
    recentRuns: (token: string) => request<unknown[]>("/api/admin/update-runs", { headers: { Authorization: `Bearer ${token}` } }),
    triggerUpdate: (token: string) =>
      request<{ results: UpdateRunResult[] }>("/api/admin/trigger-update", { method: "POST", headers: { Authorization: `Bearer ${token}` } }),
    refreshRates: (token: string) =>
      request<{ provider: string; currencies: string[] }>("/api/admin/refresh-rates", { method: "POST", headers: { Authorization: `Bearer ${token}` } }),
  },
};
