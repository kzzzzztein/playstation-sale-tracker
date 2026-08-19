import type { PriceProvider, RegionCode } from "@pst/types";
import { buildMockRawPrices } from "./mockCatalog.js";

const REGION_NAMES: Record<RegionCode, string> = {
  us: "United States",
  sg: "Singapore",
  hk: "Hong Kong",
  tr: "Turkey",
};

/**
 * Creates a clearly-labeled mock PriceProvider for a given region.
 * See mockCatalog.ts for the full explanation of why this exists and how
 * to replace it with a real data source.
 */
export function createMockProvider(regionCode: RegionCode): PriceProvider {
  return {
    regionCode,
    name: `PlayStation Store (${REGION_NAMES[regionCode]}) - Mock Provider`,
    isMock: true,
    async getGames() {
      // Simulate minor network latency so loading states are exercised
      // realistically in development.
      await new Promise((r) => setTimeout(r, 10));
      return buildMockRawPrices(regionCode);
    },
    async getGame(externalId: string) {
      const all = buildMockRawPrices(regionCode);
      return all.find((g) => g.externalId === externalId) ?? null;
    },
  };
}
