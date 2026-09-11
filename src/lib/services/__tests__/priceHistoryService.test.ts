import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchPriceHistory,
  formatChartData,
  computePriceIndicators,
  getDateRangeForPeriod,
} from "@/lib/services/priceHistoryService";
import type { PriceSnapshot, PriceHistoryStats } from "@/types/price-history";

/**
 * Unit Tests for priceHistoryService
 *
 * Tests formatChartData, computePriceIndicators, getDateRangeForPeriod,
 * and fetchPriceHistory with specific examples and edge cases.
 * **Validates: Requirements 2.1, 2.2, 4.2, 5.1, 5.2, 5.3**
 */

// --- Helper to build a minimal PriceSnapshot ---
function makeSnapshot(overrides: Partial<PriceSnapshot> = {}): PriceSnapshot {
  return {
    id: "snap-1",
    game_id: "game-1",
    store_id: "store-1",
    store_name: "Steam",
    store_logo_url: null,
    price: 29.99,
    currency: "EUR",
    platform: "PC",
    recorded_at: "2024-06-15T10:00:00Z",
    ...overrides,
  };
}

function makeStats(overrides: Partial<PriceHistoryStats> = {}): PriceHistoryStats {
  return {
    min_price: 9.99,
    max_price: 59.99,
    avg_price: 29.99,
    currency: "EUR",
    total_snapshots: 10,
    ...overrides,
  };
}

// --- formatChartData ---

describe("formatChartData", () => {
  it("returns empty array for empty snapshots", () => {
    expect(formatChartData([])).toEqual([]);
  });

  it("groups a single snapshot into one data point", () => {
    const snapshots = [makeSnapshot({ store_name: "Steam", price: 19.99 })];
    const result = formatChartData(snapshots);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ date: "2024-06-15", Steam: 19.99 });
  });

  it("groups multiple stores on the same date into one data point", () => {
    const snapshots = [
      makeSnapshot({ store_name: "Steam", price: 19.99, recorded_at: "2024-06-15T10:00:00Z" }),
      makeSnapshot({ store_name: "Epic", price: 14.99, recorded_at: "2024-06-15T12:00:00Z" }),
    ];
    const result = formatChartData(snapshots);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ date: "2024-06-15", Steam: 19.99, Epic: 14.99 });
  });

  it("creates separate data points for different dates", () => {
    const snapshots = [
      makeSnapshot({ store_name: "Steam", price: 19.99, recorded_at: "2024-06-15T10:00:00Z" }),
      makeSnapshot({ store_name: "Steam", price: 14.99, recorded_at: "2024-06-20T10:00:00Z" }),
    ];
    const result = formatChartData(snapshots);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ date: "2024-06-15", Steam: 19.99 });
    expect(result[1]).toEqual({ date: "2024-06-20", Steam: 14.99 });
  });

  it("keeps the last price when same store has multiple snapshots on same date", () => {
    const snapshots = [
      makeSnapshot({ store_name: "Steam", price: 29.99, recorded_at: "2024-06-15T08:00:00Z" }),
      makeSnapshot({ store_name: "Steam", price: 19.99, recorded_at: "2024-06-15T16:00:00Z" }),
    ];
    const result = formatChartData(snapshots);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ date: "2024-06-15", Steam: 19.99 });
  });

  it("handles multiple stores across multiple dates", () => {
    const snapshots = [
      makeSnapshot({ store_name: "Steam", price: 29.99, recorded_at: "2024-06-10T10:00:00Z" }),
      makeSnapshot({ store_name: "Epic", price: 24.99, recorded_at: "2024-06-10T10:00:00Z" }),
      makeSnapshot({ store_name: "Steam", price: 19.99, recorded_at: "2024-06-15T10:00:00Z" }),
      makeSnapshot({ store_name: "Epic", price: 14.99, recorded_at: "2024-06-15T10:00:00Z" }),
    ];
    const result = formatChartData(snapshots);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ date: "2024-06-10", Steam: 29.99, Epic: 24.99 });
    expect(result[1]).toEqual({ date: "2024-06-15", Steam: 19.99, Epic: 14.99 });
  });

  it("sorts output by date even when input snapshots are out of order", () => {
    const snapshots = [
      makeSnapshot({ store_name: "Steam", price: 14.99, recorded_at: "2024-06-20T10:00:00Z" }),
      makeSnapshot({ store_name: "Steam", price: 29.99, recorded_at: "2024-06-01T10:00:00Z" }),
      makeSnapshot({ store_name: "Steam", price: 19.99, recorded_at: "2024-06-10T10:00:00Z" }),
    ];
    const result = formatChartData(snapshots);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ date: "2024-06-01", Steam: 29.99 });
    expect(result[1]).toEqual({ date: "2024-06-10", Steam: 19.99 });
    expect(result[2]).toEqual({ date: "2024-06-20", Steam: 14.99 });
  });
});

// --- computePriceIndicators ---

describe("computePriceIndicators", () => {
  it("detects lowest price when current equals min", () => {
    const result = computePriceIndicators(9.99, makeStats({ min_price: 9.99 }));
    expect(result.isLowestPrice).toBe(true);
  });

  it("does not flag lowest price when current is above min", () => {
    const result = computePriceIndicators(19.99, makeStats({ min_price: 9.99 }));
    expect(result.isLowestPrice).toBe(false);
  });

  it("detects below average when current is less than avg", () => {
    const result = computePriceIndicators(19.99, makeStats({ avg_price: 29.99 }));
    expect(result.isBelowAverage).toBe(true);
  });

  it("does not flag below average when current equals avg", () => {
    const result = computePriceIndicators(29.99, makeStats({ avg_price: 29.99 }));
    expect(result.isBelowAverage).toBe(false);
  });

  it("does not flag below average when current is above avg", () => {
    const result = computePriceIndicators(39.99, makeStats({ avg_price: 29.99 }));
    expect(result.isBelowAverage).toBe(false);
  });

  it("handles both indicators true simultaneously", () => {
    const stats = makeStats({ min_price: 5.0, avg_price: 20.0 });
    const result = computePriceIndicators(5.0, stats);
    expect(result.isLowestPrice).toBe(true);
    expect(result.isBelowAverage).toBe(true);
  });

  it("handles both indicators false simultaneously", () => {
    const stats = makeStats({ min_price: 5.0, avg_price: 20.0 });
    const result = computePriceIndicators(25.0, stats);
    expect(result.isLowestPrice).toBe(false);
    expect(result.isBelowAverage).toBe(false);
  });

  it("handles price above max — no indicators triggered", () => {
    const stats = makeStats({ min_price: 9.99, max_price: 59.99, avg_price: 29.99 });
    const result = computePriceIndicators(69.99, stats);
    expect(result.isLowestPrice).toBe(false);
    expect(result.isBelowAverage).toBe(false);
  });
});

// --- getDateRangeForPeriod ---

describe("getDateRangeForPeriod", () => {
  it("returns a range where startDate is before endDate for all periods", () => {
    const periods = ["1m", "3m", "6m", "1y", "all"] as const;
    for (const period of periods) {
      const { startDate, endDate } = getDateRangeForPeriod(period);
      expect(startDate.getTime()).toBeLessThan(endDate.getTime());
    }
  });

  it("returns approximately 1 month range for '1m'", () => {
    const { startDate, endDate } = getDateRangeForPeriod("1m");
    // Math.round absorbs ±1 h DST shifts that make the raw diff fractional
    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(28);
    expect(diffDays).toBeLessThanOrEqual(31);
  });

  it("returns approximately 3 months range for '3m'", () => {
    const { startDate, endDate } = getDateRangeForPeriod("3m");
    const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThanOrEqual(89);
    expect(diffDays).toBeLessThanOrEqual(92);
  });

  it("returns approximately 6 months range for '6m'", () => {
    const { startDate, endDate } = getDateRangeForPeriod("6m");
    const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThanOrEqual(180);
    expect(diffDays).toBeLessThanOrEqual(185);
  });

  it("returns approximately 1 year range for '1y'", () => {
    const { startDate, endDate } = getDateRangeForPeriod("1y");
    // Math.round absorbs ±1 h DST shifts that make the raw diff fractional
    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(365);
    expect(diffDays).toBeLessThanOrEqual(366);
  });

  it("returns a start date of 2000-01-01 for 'all'", () => {
    const { startDate } = getDateRangeForPeriod("all");
    expect(startDate.getFullYear()).toBe(2000);
    expect(startDate.getMonth()).toBe(0);
    expect(startDate.getDate()).toBe(1);
  });

  it("returns endDate close to now for all periods", () => {
    const periods = ["1m", "3m", "6m", "1y", "all"] as const;
    const now = Date.now();
    for (const period of periods) {
      const { endDate } = getDateRangeForPeriod(period);
      // endDate should be within 1 second of now
      expect(Math.abs(endDate.getTime() - now)).toBeLessThan(1000);
    }
  });
});

// --- fetchPriceHistory ---

describe("fetchPriceHistory", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls the correct API URL with period param", async () => {
    const mockResponse = { history: [], stats: makeStats() };
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));

    await fetchPriceHistory("my-game", { period: "3m" });

    expect(fetchSpy).toHaveBeenCalledWith("/api/games/my-game/price-history?period=3m");
  });

  it("includes store and platform params when provided", async () => {
    const mockResponse = { history: [], stats: makeStats() };
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));

    await fetchPriceHistory("my-game", { period: "1y", store: "steam", platform: "PC" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/games/my-game/price-history?period=1y&store=steam&platform=PC"
    );
  });

  it("encodes special characters in the slug", async () => {
    const mockResponse = { history: [], stats: makeStats() };
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));

    await fetchPriceHistory("game with spaces", { period: "1m" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/games/game%20with%20spaces/price-history?period=1m"
    );
  });

  it("throws an error when the API returns a non-OK status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("Not Found", { status: 404 }));

    await expect(fetchPriceHistory("unknown", { period: "1m" })).rejects.toThrow(
      "Failed to fetch price history: 404"
    );
  });
});
