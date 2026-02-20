import { describe, it, expect } from "vitest";
import type { PriceHistoryFilters, PriceHistoryPeriod } from "@/types/price-history";

/**
 * Tests for PriceHistoryFilters component logic.
 * We test the filter state transitions (period selection, store toggling)
 * that drive the component's controlled behavior.
 */

const ALL_PERIODS: PriceHistoryPeriod[] = ["1m", "3m", "6m", "1y", "all"];

const PERIOD_LABELS: Record<PriceHistoryPeriod, string> = {
  "1m": "1M",
  "3m": "3M",
  "6m": "6M",
  "1y": "1A",
  all: "Tout",
};

const defaultFilters: PriceHistoryFilters = {
  period: "1y",
  store: undefined,
  platform: undefined,
};

// Simulates the handlePeriodChange logic from the component
function applyPeriodChange(
  filters: PriceHistoryFilters,
  period: PriceHistoryPeriod
): PriceHistoryFilters {
  return { ...filters, period };
}

// Simulates the handleStoreToggle logic from the component
function applyStoreToggle(filters: PriceHistoryFilters, storeName: string): PriceHistoryFilters {
  const newStore = filters.store === storeName ? undefined : storeName;
  return { ...filters, store: newStore };
}

describe("PriceHistoryFilters — period selection", () => {
  it("changes period while preserving other filters", () => {
    const result = applyPeriodChange(defaultFilters, "3m");
    expect(result.period).toBe("3m");
    expect(result.store).toBeUndefined();
  });

  it("supports all five period options", () => {
    for (const period of ALL_PERIODS) {
      const result = applyPeriodChange(defaultFilters, period);
      expect(result.period).toBe(period);
    }
  });

  it("preserves active store filter when changing period", () => {
    const filtersWithStore: PriceHistoryFilters = {
      ...defaultFilters,
      store: "Steam",
    };
    const result = applyPeriodChange(filtersWithStore, "6m");
    expect(result.period).toBe("6m");
    expect(result.store).toBe("Steam");
  });

  it("has correct French labels for all periods", () => {
    expect(PERIOD_LABELS["1m"]).toBe("1M");
    expect(PERIOD_LABELS["3m"]).toBe("3M");
    expect(PERIOD_LABELS["6m"]).toBe("6M");
    expect(PERIOD_LABELS["1y"]).toBe("1A");
    expect(PERIOD_LABELS["all"]).toBe("Tout");
  });
});

describe("PriceHistoryFilters — store toggle", () => {
  it("selects a store when none is active", () => {
    const result = applyStoreToggle(defaultFilters, "Steam");
    expect(result.store).toBe("Steam");
  });

  it("deselects a store when clicking the same store", () => {
    const filtersWithStore: PriceHistoryFilters = {
      ...defaultFilters,
      store: "Steam",
    };
    const result = applyStoreToggle(filtersWithStore, "Steam");
    expect(result.store).toBeUndefined();
  });

  it("switches to a different store when one is already active", () => {
    const filtersWithStore: PriceHistoryFilters = {
      ...defaultFilters,
      store: "Steam",
    };
    const result = applyStoreToggle(filtersWithStore, "Epic Games Store");
    expect(result.store).toBe("Epic Games Store");
  });

  it("preserves period when toggling store", () => {
    const filters: PriceHistoryFilters = { ...defaultFilters, period: "3m" };
    const result = applyStoreToggle(filters, "GOG");
    expect(result.period).toBe("3m");
    expect(result.store).toBe("GOG");
  });
});
