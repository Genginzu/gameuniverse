import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react";
import type { CollectionSummary } from "../../../src/types/collection";

const originalFetch = globalThis.fetch;

const mockCollections: CollectionSummary[] = [
  {
    id: "col-1",
    name: "Best RPGs",
    slug: "best-rpgs",
    description: "My favorite RPGs",
    isPublic: true,
    gamesCount: 5,
    updatedAt: "2024-02-01T00:00:00Z",
    coverImages: ["/img1.jpg", "/img2.jpg"],
  },
  {
    id: "col-2",
    name: "To Play",
    slug: "to-play",
    description: null,
    isPublic: false,
    gamesCount: 0,
    updatedAt: "2024-02-10T00:00:00Z",
    coverImages: [],
  },
];

describe("useCollections", () => {
  let mockFetch: ReturnType<typeof mock>;

  beforeEach(() => {
    mockFetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ collections: mockCollections }),
      })
    );
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should initialize with loading state", async () => {
    const { useCollections } = await import("../../../src/hooks/useCollections");
    const { result } = renderHook(() => useCollections("player-1"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.collections).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should fetch collections successfully", async () => {
    const { useCollections } = await import("../../../src/hooks/useCollections");
    const { result } = renderHook(() => useCollections("player-1"));

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.collections).toEqual(mockCollections);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith("/api/players/player-1/collections?locale=fr");
  });

  it("should handle fetch error (non-ok response)", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Internal server error" }),
      })
    );

    const { useCollections } = await import("../../../src/hooks/useCollections");
    const { result } = renderHook(() => useCollections("player-1"));

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.error).toBe("Failed to fetch collections");
    expect(result.current.collections).toEqual([]);
  });

  it("should handle network error", async () => {
    mockFetch.mockImplementation(() => Promise.reject(new Error("Network error")));

    const { useCollections } = await import("../../../src/hooks/useCollections");
    const { result } = renderHook(() => useCollections("player-1"));

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.error).toBe("Network error");
    expect(result.current.collections).toEqual([]);
  });

  it("should not fetch when playerId is empty", async () => {
    const { useCollections } = await import("../../../src/hooks/useCollections");
    const { result } = renderHook(() => useCollections(""));

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.collections).toEqual([]);
  });

  it("should handle missing collections in response", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );

    const { useCollections } = await import("../../../src/hooks/useCollections");
    const { result } = renderHook(() => useCollections("player-1"));

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.collections).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
