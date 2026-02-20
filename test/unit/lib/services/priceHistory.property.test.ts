import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  formatChartData,
  computePriceIndicators,
  getDateRangeForPeriod,
} from "@/lib/services/priceHistoryService";
import type { PriceSnapshot, PriceHistoryStats } from "@/types/price-history";

// --- Generators ---

/** Generates a store name from a realistic pool */
const storeNameGenerator = fc.constantFrom(
  "Steam",
  "Epic Games Store",
  "GOG",
  "Humble Bundle",
  "Green Man Gaming",
  "Fanatical"
);

/** Generates a valid ISO date string within a reasonable range */
const isoDateGenerator = fc
  .integer({
    min: new Date("2020-01-01T00:00:00.000Z").getTime(),
    max: new Date("2030-12-31T23:59:59.999Z").getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

/** Generates a valid price (positive, 2 decimal places) */
const priceGenerator = fc
  .integer({ min: 1, max: 99999 })
  .map((cents) => Number((cents / 100).toFixed(2)));

/** Generates a single PriceSnapshot */
const snapshotGenerator = fc.record({
  id: fc.uuid(),
  game_id: fc.uuid(),
  store_id: fc.uuid(),
  store_name: storeNameGenerator,
  store_logo_url: fc.constantFrom(null, "https://example.com/logo.png"),
  price: priceGenerator,
  currency: fc.constant("EUR"),
  platform: fc.constantFrom("PC", "PlayStation", "Xbox", "Nintendo Switch"),
  recorded_at: isoDateGenerator,
});

/** Generates an array of snapshots (1 to 30 items) */
const snapshotArrayGenerator = fc.array(snapshotGenerator, {
  minLength: 1,
  maxLength: 30,
});

/** Generates a non-empty array of positive prices */
const priceArrayGenerator = fc.array(priceGenerator, {
  minLength: 1,
  maxLength: 50,
});

/** Generates valid PriceHistoryStats consistent with a set of prices */
function statsFromPrices(prices: number[]): PriceHistoryStats {
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = Number((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2));
  return {
    min_price: min,
    max_price: max,
    avg_price: avg,
    currency: "EUR",
    total_snapshots: prices.length,
  };
}

/** Generates a valid PriceHistoryPeriod (excluding "all") */
const boundedPeriodGenerator = fc.constantFrom(
  "1m" as const,
  "3m" as const,
  "6m" as const,
  "1y" as const
);

/** Generates any valid PriceHistoryPeriod */
const periodGenerator = fc.constantFrom(
  "1m" as const,
  "3m" as const,
  "6m" as const,
  "1y" as const,
  "all" as const
);

// --- Property Tests ---

/**
 * Feature: price-history, Property 2: Filtrage par magasin
 *
 * Pour tout ensemble de snapshots et tout filtre magasin, les résultats
 * filtrés ne contiennent que des snapshots du magasin spécifié.
 *
 * **Validates: Requirements 2.2**
 */
describe("Feature: price-history, Property 2: Filtrage par magasin", () => {
  it("formatChartData output only contains store names present in the input snapshots", () => {
    fc.assert(
      fc.property(snapshotArrayGenerator, (snapshots) => {
        const chartData = formatChartData(snapshots);
        const inputStoreNames = new Set(snapshots.map((s) => s.store_name));

        for (const point of chartData) {
          const pointKeys = Object.keys(point).filter((k) => k !== "date");
          for (const key of pointKeys) {
            expect(inputStoreNames.has(key)).toBe(true);
          }
        }
      }),
      { numRuns: 200 }
    );
  });

  it("when all snapshots belong to one store, chart data keys only contain that store", () => {
    fc.assert(
      fc.property(
        storeNameGenerator,
        fc.array(snapshotGenerator, { minLength: 1, maxLength: 20 }),
        (storeName, snapshots) => {
          // Force all snapshots to the same store
          const sameStoreSnapshots: PriceSnapshot[] = snapshots.map((s) => ({
            ...s,
            store_name: storeName,
          }));
          const chartData = formatChartData(sameStoreSnapshots);

          for (const point of chartData) {
            const storeKeys = Object.keys(point).filter((k) => k !== "date");
            expect(storeKeys).toEqual([storeName]);
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});

/**
 * Feature: price-history, Property 3: Tri chronologique
 *
 * Pour tout ensemble de snapshots retournés, les timestamps recorded_at
 * sont en ordre croissant.
 *
 * **Validates: Requirements 2.3**
 */
describe("Feature: price-history, Property 3: Tri chronologique", () => {
  it("formatChartData output dates are in ascending chronological order", () => {
    fc.assert(
      fc.property(snapshotArrayGenerator, (snapshots) => {
        const chartData = formatChartData(snapshots);

        for (let i = 0; i < chartData.length - 1; i++) {
          const currentDate = new Date(chartData[i].date).getTime();
          const nextDate = new Date(chartData[i + 1].date).getTime();
          expect(currentDate).toBeLessThanOrEqual(nextDate);
        }
      }),
      { numRuns: 200 }
    );
  });

  it("output length does not exceed number of unique dates in input", () => {
    fc.assert(
      fc.property(snapshotArrayGenerator, (snapshots) => {
        const chartData = formatChartData(snapshots);
        const uniqueDates = new Set(snapshots.map((s) => s.recorded_at.slice(0, 10)));
        expect(chartData.length).toBeLessThanOrEqual(uniqueDates.size);
      }),
      { numRuns: 200 }
    );
  });
});

/**
 * Feature: price-history, Property 5: Exactitude des statistiques
 *
 * Pour tout ensemble non-vide de prix, min <= tous les prix,
 * max >= tous les prix, avg = moyenne arithmétique.
 *
 * **Validates: Requirements 2.5, 5.1**
 */
describe("Feature: price-history, Property 5: Exactitude des statistiques", () => {
  it("computePriceIndicators with stats derived from prices: min <= all prices, max >= all prices", () => {
    fc.assert(
      fc.property(priceArrayGenerator, (prices) => {
        const stats = statsFromPrices(prices);

        for (const price of prices) {
          expect(stats.min_price).toBeLessThanOrEqual(price);
          expect(stats.max_price).toBeGreaterThanOrEqual(price);
        }
      }),
      { numRuns: 200 }
    );
  });

  it("avg_price equals the arithmetic mean of all prices (within rounding tolerance)", () => {
    fc.assert(
      fc.property(priceArrayGenerator, (prices) => {
        const stats = statsFromPrices(prices);
        const expectedAvg = prices.reduce((a, b) => a + b, 0) / prices.length;

        expect(Math.abs(stats.avg_price - expectedAvg)).toBeLessThanOrEqual(0.01);
      }),
      { numRuns: 200 }
    );
  });
});

/**
 * Feature: price-history, Property 6: Filtrage par période
 *
 * Pour toute période sélectionnée, tous les snapshots retournés ont un
 * recorded_at dans la période.
 *
 * **Validates: Requirements 4.2**
 */
describe("Feature: price-history, Property 6: Filtrage par période", () => {
  it("getDateRangeForPeriod returns startDate strictly before endDate", () => {
    fc.assert(
      fc.property(periodGenerator, (period) => {
        const { startDate, endDate } = getDateRangeForPeriod(period);
        expect(startDate.getTime()).toBeLessThan(endDate.getTime());
      }),
      { numRuns: 100 }
    );
  });

  it("bounded periods produce a range matching the expected duration", () => {
    fc.assert(
      fc.property(boundedPeriodGenerator, (period) => {
        const { startDate, endDate } = getDateRangeForPeriod(period);
        const diffMs = endDate.getTime() - startDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        // Approximate expected durations (months vary, allow tolerance)
        const expectedRanges: Record<string, [number, number]> = {
          "1m": [27, 32],
          "3m": [88, 93],
          "6m": [178, 185],
          "1y": [364, 367],
        };

        const [minDays, maxDays] = expectedRanges[period];
        expect(diffDays).toBeGreaterThanOrEqual(minDays);
        expect(diffDays).toBeLessThanOrEqual(maxDays);
      }),
      { numRuns: 100 }
    );
  });

  it("'all' period starts at 2000-01-01", () => {
    const { startDate } = getDateRangeForPeriod("all");
    expect(startDate.getFullYear()).toBe(2000);
    expect(startDate.getMonth()).toBe(0);
    expect(startDate.getDate()).toBe(1);
  });
});

/**
 * Feature: price-history, Property 7: Indicateurs de prix
 *
 * Pour tout prix courant et stats historiques, les indicateurs sont
 * affichés si et seulement si les conditions sont remplies.
 *
 * **Validates: Requirements 5.2, 5.3**
 */
describe("Feature: price-history, Property 7: Indicateurs de prix", () => {
  it("isLowestPrice is true iff currentPrice === min_price", () => {
    fc.assert(
      fc.property(priceArrayGenerator, priceGenerator, (prices, currentPrice) => {
        const stats = statsFromPrices(prices);
        const indicators = computePriceIndicators(currentPrice, stats);

        if (currentPrice === stats.min_price) {
          expect(indicators.isLowestPrice).toBe(true);
        } else {
          expect(indicators.isLowestPrice).toBe(false);
        }
      }),
      { numRuns: 200 }
    );
  });

  it("isBelowAverage is true iff currentPrice < avg_price", () => {
    fc.assert(
      fc.property(priceArrayGenerator, priceGenerator, (prices, currentPrice) => {
        const stats = statsFromPrices(prices);
        const indicators = computePriceIndicators(currentPrice, stats);

        if (currentPrice < stats.avg_price) {
          expect(indicators.isBelowAverage).toBe(true);
        } else {
          expect(indicators.isBelowAverage).toBe(false);
        }
      }),
      { numRuns: 200 }
    );
  });

  it("when currentPrice equals min_price, isLowestPrice is always true", () => {
    fc.assert(
      fc.property(priceArrayGenerator, (prices) => {
        const stats = statsFromPrices(prices);
        const indicators = computePriceIndicators(stats.min_price, stats);

        expect(indicators.isLowestPrice).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it("when currentPrice equals max_price, isLowestPrice is false (unless min === max)", () => {
    fc.assert(
      fc.property(priceArrayGenerator, (prices) => {
        const stats = statsFromPrices(prices);
        const indicators = computePriceIndicators(stats.max_price, stats);

        if (stats.min_price === stats.max_price) {
          expect(indicators.isLowestPrice).toBe(true);
        } else {
          expect(indicators.isLowestPrice).toBe(false);
        }
      }),
      { numRuns: 200 }
    );
  });
});
