import { describe, it, expect } from "vitest";
import { convertToPhp, calculateDiscountPercentage } from "@pst/shared";
import { enrichPrice } from "./enrich.js";
import { buildMockRawPrices } from "../providers/mockCatalog.js";
import { computeStats } from "@pst/database";

describe("currency conversion", () => {
  it("converts using the supplied rate", () => {
    expect(convertToPhp(39.99, 58.5)).toBeCloseTo(2339.42, 1);
  });

  it("returns null when no rate is available", () => {
    expect(convertToPhp(39.99, null)).toBeNull();
  });
});

describe("discount calculation", () => {
  it("computes a whole-number percentage", () => {
    expect(calculateDiscountPercentage(59.99, 29.99)).toBe(50);
  });

  it("returns 0 when there is no sale price", () => {
    expect(calculateDiscountPercentage(59.99, null)).toBe(0);
  });

  it("returns 0 when the 'sale' price is not actually lower", () => {
    expect(calculateDiscountPercentage(59.99, 59.99)).toBe(0);
  });
});

describe("enrichPrice", () => {
  it("uses the sale price when on sale", () => {
    const price = {
      id: "1",
      gameId: "g1",
      regionId: "r1",
      regionCode: "us" as const,
      originalPrice: 60,
      salePrice: 30,
      discountPercentage: 50,
      saleStart: null,
      saleEnd: null,
      isOnSale: true,
      currency: "USD",
      updatedAt: new Date().toISOString(),
    };
    const enriched = enrichPrice(price, { USD: 58.5 });
    expect(enriched.phpEquivalent).toBeCloseTo(1755, 0);
  });
});

describe("mock catalog", () => {
  it("produces one raw price per catalog entry, per region", () => {
    const us = buildMockRawPrices("us");
    const tr = buildMockRawPrices("tr");
    expect(us.length).toBeGreaterThan(0);
    expect(us.length).toBe(tr.length);
    expect(us.every((p) => p.regionCode === "us")).toBe(true);
  });

  it("never produces a sale price higher than the original price", () => {
    for (const region of ["us", "sg", "hk", "tr"] as const) {
      for (const raw of buildMockRawPrices(region)) {
        if (raw.salePrice !== null) {
          expect(raw.salePrice).toBeLessThanOrEqual(raw.originalPrice);
        }
      }
    }
  });
});

describe("computeStats", () => {
  it("finds the lowest, highest and average of a price series", () => {
    const history = [
      { id: "1", gameId: "g", regionId: "r", regionCode: "us" as const, price: 59.99, currency: "USD", recordedAt: "2026-08-01T00:00:00Z" },
      { id: "2", gameId: "g", regionId: "r", regionCode: "us" as const, price: 39.99, currency: "USD", recordedAt: "2026-08-05T00:00:00Z" },
      { id: "3", gameId: "g", regionId: "r", regionCode: "us" as const, price: 29.99, currency: "USD", recordedAt: "2026-08-10T00:00:00Z" },
      { id: "4", gameId: "g", regionId: "r", regionCode: "us" as const, price: 39.99, currency: "USD", recordedAt: "2026-08-15T00:00:00Z" },
    ];
    const stats = computeStats(history, 39.99);
    expect(stats?.lowest).toBe(29.99);
    expect(stats?.highest).toBe(59.99);
    expect(stats?.timesOnSale).toBe(2);
  });
});
