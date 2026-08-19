import type { PriceProvider, RegionCode } from "@pst/types";
import { createMockProvider } from "./mockProvider.js";

/**
 * Central provider registry. Ingestion code (src/services/ingestion.ts,
 * src/scheduled.ts) only ever imports `getProvider` / `ALL_REGION_CODES`
 * from this file - never a concrete provider directly. This is what makes
 * "swap mock for real data" a one-file change.
 *
 * To add a new region:
 *   1. Add its code to RegionCode in packages/types.
 *   2. Add a row to REGIONS_META in packages/shared.
 *   3. Add a migration seeding the `regions` table.
 *   4. Register a provider for it below.
 */
export const ALL_REGION_CODES: RegionCode[] = ["us", "sg", "hk", "tr"];

const providers: Partial<Record<RegionCode, PriceProvider>> = {};

export function getProvider(regionCode: RegionCode): PriceProvider {
  if (!providers[regionCode]) {
    // Swap this line per-region once a real, legally-sourced provider
    // exists, e.g.: providers.us = createLiveUsProvider(env)
    providers[regionCode] = createMockProvider(regionCode);
  }
  return providers[regionCode]!;
}

export function getAllProviders(): PriceProvider[] {
  return ALL_REGION_CODES.map(getProvider);
}
