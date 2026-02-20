import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { PriceHistoryFilters, PriceHistoryResponse } from "@/types/price-history";

const originalFetch = globalThis.fetch;

const mockResponse: PriceHistoryResponse = {
  history: [
    {
      id: "snap-1",
      game_id: "game-1",
      store_id: "store-1",
      store_name: "Steam",
      store_logo_url: "/steam.png",
      price: 49.99,
      currency: "EUR",
      platform: "PC",
      recorded_at: "2024-01-15T00:00:00Z",
    },
    {
      id: "snap-2",
      game_id: "game-1",
      store_id: "store-1",
      store_name: "Steam",
      store_logo_url: "/steam.png",
      price: 39.99,
      currency: "EUR",
      platform: "PC",
      recorded_at: "2024-02-15T00:00:00Z",
    },
  ],
  stats: {
    min_price: 39.99,
    max_price: 49.99,
    avg_price: 44.99,
    currency: "EUR",
    total_snapshots: 2,
  },
};

const defaultFilters: PriceHistoryFilters = { period: "1y" };

import { usePriceHistory } from "@/hooks/usePriceHistory";

describe("usePriceHistory", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      })
    );
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should initialize with loading state", async () => {
    const { result } = renderHook(() => usePriceHistory("my-game", defaultFilters));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.history).toEqual([]);
    expect(result.current.stats).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should fetch price history successfully", async () => {
    const { result } = renderHook(() => usePriceHistory("my-game", defaultFilters));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.history).toEqual(mockResponse.history);
    expect(result.current.stats).toEqual(mockResponse.stats);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith("/api/games/my-game/price-history?period=1y");
  });

  it("should handle fetch error", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      })
    );

    const { result } = renderHook(() => usePriceHistory("my-game", defaultFilters));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to fetch price history: 500");
    expect(result.current.history).toEqual([]);
    expect(result.current.stats).toBeNull();
  });

  it("should handle network error", async () => {
    mockFetch.mockImplementation(() => Promise.reject(new Error("Network error")));

    const { result } = renderHook(() => usePriceHistory("my-game", defaultFilters));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.history).toEqual([]);
    expect(result.current.stats).toBeNull();
  });

  it("should not fetch when gameSlug is empty", async () => {
    const { result } = renderHook(() => usePriceHistory("", defaultFilters));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.history).toEqual([]);
    expect(result.current.stats).toBeNull();
  });

  it("should pass store and platform filters to the API", async () => {
    const filters: PriceHistoryFilters = {
      period: "3m",
      store: "steam",
      platform: "PC",
    };

    const { result } = renderHook(() => usePriceHistory("my-game", filters));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/games/my-game/price-history?period=3m&store=steam&platform=PC"
    );
  });

  it("should refetch when filters change", async () => {
    const { result, rerender } = renderHook(
      ({ slug, filters }: { slug: string; filters: PriceHistoryFilters }) =>
        usePriceHistory(slug, filters),
      { initialProps: { slug: "my-game", filters: { period: "1y" as const } } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    rerender({ slug: "my-game", filters: { period: "3m" as const } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    expect(mockFetch).toHaveBeenLastCalledWith("/api/games/my-game/price-history?period=3m");
  });
});
