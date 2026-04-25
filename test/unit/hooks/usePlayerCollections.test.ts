import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePlayerCollections } from "@/hooks/usePlayerCollections";

const mockCollectionsResponse = {
  collections: [
    { id: "c1", name: "Favorites", gamesCount: 5, isPublic: true, updatedAt: "2024-01-01" },
  ],
  stats: { totalCollections: 1, totalGames: 5, largestCollection: "Favorites" },
  pagination: { currentPage: 1, totalPages: 1, hasNextPage: false },
};

describe("usePlayerCollections", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCollectionsResponse),
    });
  });

  it("returns loading initially", () => {
    const { result } = renderHook(() => usePlayerCollections("player-1", "fr", false));
    expect(result.current.isLoading).toBe(true);
  });

  it("returns collections after fetch", async () => {
    const { result } = renderHook(() => usePlayerCollections("player-1", "fr", false));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.collections).toEqual(mockCollectionsResponse.collections);
    expect(result.current.stats).toEqual(mockCollectionsResponse.stats);
    expect(result.current.error).toBeNull();
  });

  it("handles error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Server error" }),
    });

    const { result } = renderHook(() => usePlayerCollections("player-1", "fr", false));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("Server error");
  });
});
