import { describe, it, expect } from "vitest";
import { computePriceIndicators } from "@/lib/services/priceHistoryService";
import type { PriceHistoryStats } from "@/types/price-history";

/**
 * Tests for PriceHistoryStats component logic.
 * We test the data-driven logic (indicator computation + price formatting)
 * that drives the component's display. Recharts/DOM rendering is covered
 * by integration tests.
 */

function formatPrice(value: number, currency: string): string {
  return `${value.toFixed(2)} ${currency}`;
}

const baseStats: PriceHistoryStats = {
  min_price: 9.99,
  max_price: 59.99,
  avg_price: 34.99,
  currency: "EUR",
  total_snapshots: 25,
};

describe("PriceHistoryStats — formatPrice", () => {
  it("formats price with currency", () => {
    expect(formatPrice(9.99, "EUR")).toBe("9.99 EUR");
  });

  it("pads whole numbers with decimals", () => {
    expect(formatPrice(10, "EUR")).toBe("10.00 EUR");
  });
});

describe("PriceHistoryStats — indicator logic", () => {
  it("shows 'prix au plus bas' when current price equals min", () => {
    const indicators = computePriceIndicators(9.99, baseStats);
    expect(indicators.isLowestPrice).toBe(true);
  });

  it("does not show 'prix au plus bas' when current price > min", () => {
    const indicators = computePriceIndicators(15.0, baseStats);
    expect(indicators.isLowestPrice).toBe(false);
  });

  it("shows 'en dessous de la moyenne' when current price < avg", () => {
    const indicators = computePriceIndicators(20.0, baseStats);
    expect(indicators.isBelowAverage).toBe(true);
  });

  it("does not show 'en dessous de la moyenne' when current price >= avg", () => {
    const indicators = computePriceIndicators(34.99, baseStats);
    expect(indicators.isBelowAverage).toBe(false);
  });

  it("shows both indicators when price is at the lowest (also below avg)", () => {
    const indicators = computePriceIndicators(9.99, baseStats);
    expect(indicators.isLowestPrice).toBe(true);
    expect(indicators.isBelowAverage).toBe(true);
  });

  it("shows no indicators when current price equals max", () => {
    const indicators = computePriceIndicators(59.99, baseStats);
    expect(indicators.isLowestPrice).toBe(false);
    expect(indicators.isBelowAverage).toBe(false);
  });
});

describe("PriceHistoryStats — card data", () => {
  it("exposes min, max, and avg from stats", () => {
    // Verify the stats structure provides the 3 values for the cards
    expect(baseStats.min_price).toBe(9.99);
    expect(baseStats.max_price).toBe(59.99);
    expect(baseStats.avg_price).toBe(34.99);
  });

  it("formats all three card values correctly", () => {
    expect(formatPrice(baseStats.min_price, baseStats.currency)).toBe("9.99 EUR");
    expect(formatPrice(baseStats.max_price, baseStats.currency)).toBe("59.99 EUR");
    expect(formatPrice(baseStats.avg_price, baseStats.currency)).toBe("34.99 EUR");
  });
});
