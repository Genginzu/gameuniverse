import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { CollectionSummary } from "@/types/collection";
import { createSWRWrapper } from "../../helpers/swr-wrapper";

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

/** Helper pour créer une Response JSON valide */
function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

import { useCollections } from "@/hooks/useCollections";

describe("useCollections", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn(() => Promise.resolve(jsonResponse({ collections: mockCollections })));
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should initialize with loading state", () => {
    const { result } = renderHook(() => useCollections("player-1"), {
      wrapper: createSWRWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.collections).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should fetch collections successfully", async () => {
    const { result } = renderHook(() => useCollections("player-1"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.collections).toEqual(mockCollections);
    expect(result.current.error).toBeNull();
  });

  it("should handle fetch error (non-ok response)", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve(jsonResponse({ error: "Internal server error" }, 500))
    );

    const { result } = renderHook(() => useCollections("player-1"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.collections).toEqual([]);
  });

  it("should handle network error", async () => {
    mockFetch.mockImplementation(() => Promise.reject(new TypeError("fetch failed")));

    const { result } = renderHook(() => useCollections("player-1"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.collections).toEqual([]);
  });

  it("should not fetch when playerId is empty", async () => {
    const { result } = renderHook(() => useCollections(""), {
      wrapper: createSWRWrapper(),
    });

    // SWR key is null → pas de fetch, isLoading reste false
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.collections).toEqual([]);
  });
});
