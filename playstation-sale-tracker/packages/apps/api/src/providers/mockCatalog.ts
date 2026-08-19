/**
 * Shared mock catalog used by every regional provider (src/providers/*Provider.ts).
 *
 * IMPORTANT - read this before wiring a real data source:
 * PlayStation does not publish a public, unauthenticated API for store
 * pricing. This file intentionally contains hand-written SAMPLE data only,
 * clearly labeled as such (`isMock: true` on every provider). It exists so
 * the rest of the application (ingestion, DB, API, frontend) has something
 * real to run against during development.
 *
 * To replace it with live data:
 *   1. Identify a data source you are legally permitted to use (e.g. your
 *      own scraper you have rights to run, a licensed third-party API, or
 *      manual/CSV data entry from store pages you monitor yourself).
 *   2. Implement `PriceProvider` (see @pst/types) against that source in a
 *      new file, e.g. `usProvider.live.ts`.
 *   3. Swap the import in `src/providers/registry.ts` - nothing else in the
 *      app needs to change, because routes/scheduled.ts only depend on the
 *      `PriceProvider` interface, never on a concrete provider.
 */
import type { RawGamePrice, RegionCode } from "@pst/types";

interface MockGameDefinition {
  externalId: string;
  title: string;
  platform: "PS5" | "PS4" | "PS5,PS4";
  coverImage: string;
  basePriceUSD: number;
  discountPercent: number; // 0 = not on sale
  saleWindowDays: [number, number]; // [startOffsetDays, endOffsetDays] from "now"
}

// Base catalog, priced in USD. Regional providers derive their own currency
// pricing and discount timing from this so relative "which region is
// cheapest" comparisons stay interesting and realistic in dev/demo mode.
export const MOCK_CATALOG: MockGameDefinition[] = [
  {
    externalId: "concept-spiderman-2",
    title: "Marvel's Spider-Man 2",
    platform: "PS5",
    coverImage: "https://picsum.photos/seed/spiderman2-cover/600/800",
    basePriceUSD: 69.99,
    discountPercent: 40,
    saleWindowDays: [-3, 4],
  },
  {
    externalId: "concept-elden-ring",
    title: "Elden Ring",
    platform: "PS5,PS4",
    coverImage: "https://picsum.photos/seed/eldenring-cover/600/800",
    basePriceUSD: 59.99,
    discountPercent: 55,
    saleWindowDays: [-10, 2],
  },
  {
    externalId: "concept-miles-morales",
    title: "Marvel's Spider-Man: Miles Morales",
    platform: "PS5,PS4",
    coverImage: "https://picsum.photos/seed/milesmorales-cover/600/800",
    basePriceUSD: 49.99,
    discountPercent: 70,
    saleWindowDays: [-5, 9],
  },
  {
    externalId: "concept-god-of-war-ragnarok",
    title: "God of War Ragnarök",
    platform: "PS5,PS4",
    coverImage: "https://picsum.photos/seed/gowr-cover/600/800",
    basePriceUSD: 69.99,
    discountPercent: 30,
    saleWindowDays: [-1, 6],
  },
  {
    externalId: "concept-horizon-forbidden-west",
    title: "Horizon Forbidden West",
    platform: "PS5,PS4",
    coverImage: "https://picsum.photos/seed/horizonfw-cover/600/800",
    basePriceUSD: 49.99,
    discountPercent: 60,
    saleWindowDays: [-7, 3],
  },
  {
    externalId: "concept-ff7-rebirth",
    title: "Final Fantasy VII Rebirth",
    platform: "PS5",
    coverImage: "https://picsum.photos/seed/ff7rebirth-cover/600/800",
    basePriceUSD: 69.99,
    discountPercent: 25,
    saleWindowDays: [-2, 8],
  },
  {
    externalId: "concept-baldurs-gate-3",
    title: "Baldur's Gate 3",
    platform: "PS5",
    coverImage: "https://picsum.photos/seed/bg3-cover/600/800",
    basePriceUSD: 59.99,
    discountPercent: 20,
    saleWindowDays: [-4, 5],
  },
  {
    externalId: "concept-hogwarts-legacy",
    title: "Hogwarts Legacy",
    platform: "PS5,PS4",
    coverImage: "https://picsum.photos/seed/hogwarts-cover/600/800",
    basePriceUSD: 59.99,
    discountPercent: 65,
    saleWindowDays: [-6, 1],
  },
  {
    externalId: "concept-street-fighter-6",
    title: "Street Fighter 6",
    platform: "PS5,PS4",
    coverImage: "https://picsum.photos/seed/sf6-cover/600/800",
    basePriceUSD: 59.99,
    discountPercent: 50,
    saleWindowDays: [-8, 4],
  },
  {
    externalId: "concept-last-of-us-2",
    title: "The Last of Us Part II Remastered",
    platform: "PS5",
    coverImage: "https://picsum.photos/seed/tlou2-cover/600/800",
    basePriceUSD: 49.99,
    discountPercent: 33,
    saleWindowDays: [-3, 3],
  },
  {
    externalId: "concept-diablo-4",
    title: "Diablo IV",
    platform: "PS5,PS4",
    coverImage: "https://picsum.photos/seed/diablo4-cover/600/800",
    basePriceUSD: 69.99,
    discountPercent: 45,
    saleWindowDays: [-5, 7],
  },
  {
    externalId: "concept-stellar-blade",
    title: "Stellar Blade",
    platform: "PS5",
    coverImage: "https://picsum.photos/seed/stellarblade-cover/600/800",
    basePriceUSD: 69.99,
    discountPercent: 15,
    saleWindowDays: [-1, 10],
  },
];

// Small deterministic multipliers so each region's local pricing feels
// realistic relative to USD (regional PlayStation pricing is rarely a clean
// FX conversion - Turkey and Southeast Asia pricing especially diverges).
const REGION_PRICE_FACTORS: Record<RegionCode, { currency: string; factor: number; discountAdjust: number }> = {
  us: { currency: "USD", factor: 1, discountAdjust: 0 },
  sg: { currency: "SGD", factor: 1.42, discountAdjust: 0 },
  hk: { currency: "HKD", factor: 6.35, discountAdjust: -5 },
  tr: { currency: "TRY", factor: 22.4, discountAdjust: 5 },
};

function roundPrice(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildMockRawPrices(regionCode: RegionCode): RawGamePrice[] {
  const factorInfo = REGION_PRICE_FACTORS[regionCode];
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  return MOCK_CATALOG.map((def) => {
    const originalPrice = roundPrice(def.basePriceUSD * factorInfo.factor);
    const effectiveDiscount = Math.max(0, Math.min(90, def.discountPercent + factorInfo.discountAdjust));
    const hasSale = effectiveDiscount > 0;
    const salePrice = hasSale ? roundPrice(originalPrice * (1 - effectiveDiscount / 100)) : null;

    const [startOffset, endOffset] = def.saleWindowDays;
    const saleStart = hasSale ? new Date(now + startOffset * day).toISOString() : null;
    const saleEnd = hasSale ? new Date(now + endOffset * day).toISOString() : null;

    const raw: RawGamePrice = {
      externalId: def.externalId,
      title: def.title,
      platform: def.platform,
      coverImage: def.coverImage,
      storeUrl: null,
      regionCode,
      currency: factorInfo.currency,
      originalPrice,
      salePrice,
      saleStart,
      saleEnd,
    };
    return raw;
  });
}
