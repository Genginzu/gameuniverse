import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

const { mockRpc } = vi.hoisted(() => ({ mockRpc: vi.fn() }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ rpc: mockRpc }),
}));

import {
  getGamePrices,
  getBestPrice,
  compareGamePrices,
  getActiveStores,
  searchStores,
  validateStoreData,
  getStoreStats,
  createDetailedPriceComparison,
} from "@/lib/pricing";

beforeEach(() => {
  vi.clearAllMocks();
});

/**
 * Feature: game-pricing-structure — Unit & integration tests (tasks 6.1–6.2)
 * and Property 5 (price comparison accuracy, task 5.4).
 *
 * The database RPC layer is mocked, so these tests cover the application-side
 * contract of each pricing helper: parameter mapping, result shaping, empty
 * states and error propagation.
 */

// ---------------------------------------------------------------------------
// Task 6.1 — Price retrieval
// ---------------------------------------------------------------------------

describe("getGamePrices — filters", () => {
  it("forwards store and platform filters to the RPC", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    await getGamePrices("game-1", { store_filter: "steam", platform_filter: "PC" });
    expect(mockRpc).toHaveBeenCalledWith("get_game_prices", {
      game_uuid: "game-1",
      store_filter: "steam",
      platform_filter: "PC",
    });
  });

  it("passes undefined filters when none are provided", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    await getGamePrices("game-1");
    expect(mockRpc).toHaveBeenCalledWith("get_game_prices", {
      game_uuid: "game-1",
      store_filter: undefined,
      platform_filter: undefined,
    });
  });

  it("returns an empty array when no prices exist", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    await expect(getGamePrices("game-1")).resolves.toEqual([]);
  });
});

describe("getBestPrice — multiple stores", () => {
  it("returns the single row exposed by the RPC", async () => {
    mockRpc.mockResolvedValue({
      data: [{ price: 9.99, store_name: "GOG", currency: "EUR" }],
      error: null,
    });
    const best = await getBestPrice("game-1");
    expect(best).toEqual({ price: 9.99, store_name: "GOG", currency: "EUR" });
  });

  it("returns null when the game has no price", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    await expect(getBestPrice("game-1")).resolves.toBeNull();
  });

  it("throws a descriptive error on RPC failure", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(getBestPrice("game-1")).rejects.toThrow("Failed to get best price: boom");
  });
});

// ---------------------------------------------------------------------------
// Task 6.2 — Store management
// ---------------------------------------------------------------------------

describe("getActiveStores", () => {
  it("returns the active stores from the RPC", async () => {
    const stores = [{ id: "s1", name: "Steam", is_active: true }];
    mockRpc.mockResolvedValue({ data: stores, error: null });
    await expect(getActiveStores()).resolves.toEqual(stores);
  });

  it("returns an empty array when the RPC yields no data", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    await expect(getActiveStores()).resolves.toEqual([]);
  });
});

describe("searchStores", () => {
  it("forwards the search term", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    await searchStores("epic");
    expect(mockRpc).toHaveBeenCalledWith("search_stores", { search_term: "epic" });
  });
});

describe("validateStoreData", () => {
  it("returns the validation verdict from the RPC", async () => {
    mockRpc.mockResolvedValue({
      data: [{ is_valid: false, error_message: "name taken" }],
      error: null,
    });
    const result = await validateStoreData({ name: "Steam" });
    expect(result).toEqual({ is_valid: false, error_message: "name taken" });
  });

  it("falls back to an invalid verdict when no row is returned", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    const result = await validateStoreData({ name: "Steam" });
    expect(result).toEqual({ is_valid: false, error_message: "Unknown error" });
  });
});

describe("getStoreStats", () => {
  it("returns the first stats row", async () => {
    const stats = { store_id: "s1", store_name: "Steam", total_games: 42 };
    mockRpc.mockResolvedValue({ data: [stats], error: null });
    await expect(getStoreStats("s1")).resolves.toEqual(stats);
  });

  it("returns null when no stats exist", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    await expect(getStoreStats("s1")).resolves.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Task 6.1 / Property 5 — Price comparison accuracy
// ---------------------------------------------------------------------------

describe("compareGamePrices", () => {
  it("returns the comparison row from the RPC", async () => {
    const comparison = { game_id: "g1", best_price: 5, worst_price: 20, currency: "EUR" };
    mockRpc.mockResolvedValue({ data: [comparison], error: null });
    await expect(compareGamePrices("g1")).resolves.toEqual(comparison);
  });
});

/**
 * Routes each RPC call to the matching mocked payload so that
 * `createDetailedPriceComparison` (which fans out to `get_game_prices` and
 * `compare_game_prices` in parallel) can be exercised end to end.
 */
function routeRpc(prices: unknown[], comparison: unknown) {
  mockRpc.mockImplementation((fn: string) => {
    if (fn === "get_game_prices") return Promise.resolve({ data: prices, error: null });
    if (fn === "compare_game_prices") {
      return Promise.resolve({ data: comparison ? [comparison] : [], error: null });
    }
    return Promise.resolve({ data: [], error: null });
  });
}

describe("createDetailedPriceComparison", () => {
  it("returns null when the game has no prices", async () => {
    routeRpc([], null);
    await expect(createDetailedPriceComparison("g1")).resolves.toBeNull();
  });

  it("Property 5: best_price is always the global minimum across stores", async () => {
    const priceRowGen = fc.record({
      store_id: fc.uuid(),
      price: fc.float({ min: 0, max: 10000, noNaN: true }),
      currency: fc.constant("EUR"),
      platform: fc.constantFrom("PC", "Xbox", "PlayStation"),
    });

    await fc.assert(
      fc.asyncProperty(fc.array(priceRowGen, { minLength: 1, maxLength: 25 }), async (rows) => {
        routeRpc(rows, null);
        const result = await createDetailedPriceComparison("g1");
        expect(result).not.toBeNull();
        const expectedMin = Math.min(...rows.map((r) => r.price));
        expect(result!.best_price.price).toBe(expectedMin);
        expect(result!.store_count).toBe(rows.length);
      }),
      { numRuns: 150 }
    );
  });
});
