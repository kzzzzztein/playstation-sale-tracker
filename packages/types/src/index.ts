/**
 * Shared domain types used by apps/web, apps/api and packages/database.
 * This is the single source of truth for the shape of data moving through
 * the system, so the frontend and backend never drift apart.
 */

// ---------------------------------------------------------------------------
// Regions
// ---------------------------------------------------------------------------

/** Stable region codes. Adding a region = adding one entry here + one DB row. */
export type RegionCode = "us" | "sg" | "hk" | "tr";

export interface Region {
  id: string;
  code: RegionCode;
  name: string;
  currency: string; // ISO 4217, e.g. "USD"
  currencySymbol: string; // e.g. "$"
  flagEmoji: string; // e.g. "🇺🇸" - used as a lightweight flag glyph
  storeLocale: string; // PlayStation Store locale slug, e.g. "en-us"
}

// ---------------------------------------------------------------------------
// Games
// ---------------------------------------------------------------------------

export type Platform = "PS5" | "PS4" | "PS5,PS4";

export interface Game {
  id: string;
  title: string;
  slug: string;
  platform: Platform;
  coverImage: string | null;
  storeUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Prices
// ---------------------------------------------------------------------------

export interface GamePrice {
  id: string;
  gameId: string;
  regionId: string;
  regionCode: RegionCode;
  originalPrice: number;
  salePrice: number | null;
  discountPercentage: number; // 0 when not on sale
  saleStart: string | null;
  saleEnd: string | null;
  isOnSale: boolean;
  currency: string;
  updatedAt: string;
}

/** A GamePrice enriched with a live PHP conversion, for API responses. */
export interface GamePriceWithPHP extends GamePrice {
  phpEquivalent: number | null; // null if the exchange rate is unavailable
  exchangeRateUsed: number | null;
}

export interface PriceHistoryEntry {
  id: string;
  gameId: string;
  regionId: string;
  regionCode: RegionCode;
  price: number;
  currency: string;
  recordedAt: string;
}

export interface PriceStats {
  lowest: number;
  lowestRecordedAt: string;
  highest: number;
  highestRecordedAt: string;
  average: number;
  current: number;
  priceChange: number; // current - previous, negative = price drop
  priceChangePercentage: number;
  timesOnSale: number;
}

export interface RegionPriceStats extends PriceStats {
  regionCode: RegionCode;
}

// ---------------------------------------------------------------------------
// Exchange rates
// ---------------------------------------------------------------------------

export interface ExchangeRate {
  id: string;
  currency: string;
  phpRate: number; // 1 unit of `currency` = phpRate PHP
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Composite / API response shapes
// ---------------------------------------------------------------------------

export interface GameWithPrices extends Game {
  prices: GamePriceWithPHP[];
  cheapestRegion: RegionCode | null;
  cheapestPricePhp: number | null;
}

export interface GameDetail extends GameWithPrices {
  historicalLowest: {
    overall: { regionCode: RegionCode; price: number; phpEquivalent: number | null } | null;
    byRegion: Record<RegionCode, { price: number; phpEquivalent: number | null } | undefined>;
  };
  priceHistory: PriceHistoryEntry[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export interface AdminStats {
  totalGames: number;
  totalPriceRecords: number;
  totalRegions: number;
  lastSuccessfulUpdate: string | null;
  lastFailedUpdate: { at: string; reason: string } | null;
  gamesOnSale: number;
}

export interface UpdateRunResult {
  provider: RegionCode;
  startedAt: string;
  finishedAt: string;
  success: boolean;
  gamesProcessed: number;
  pricesChanged: number;
  historyRecordsInserted: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Provider layer (data ingestion contract)
// ---------------------------------------------------------------------------

/** Raw price data as returned by a region-specific provider, pre-normalization. */
export interface RawGamePrice {
  /** Provider-specific external id (e.g. PlayStation Store product id / concept id). */
  externalId: string;
  title: string;
  platform: Platform;
  coverImage: string | null;
  storeUrl: string | null;
  regionCode: RegionCode;
  currency: string;
  originalPrice: number;
  salePrice: number | null;
  saleStart: string | null;
  saleEnd: string | null;
}

export interface PriceProvider {
  regionCode: RegionCode;
  /** Human-readable name for logs/admin UI, e.g. "PlayStation Store (US) - Mock". */
  name: string;
  /** Whether this provider returns real live data or clearly-labeled mock data. */
  isMock: boolean;
  getGames(): Promise<RawGamePrice[]>;
  getGame(externalId: string): Promise<RawGamePrice | null>;
}

export interface ExchangeRateProvider {
  name: string;
  /** Fetch PHP rates for the given ISO currency codes. */
  getRates(currencies: string[]): Promise<Record<string, number>>;
}
