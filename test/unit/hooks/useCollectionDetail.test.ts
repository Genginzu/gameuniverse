import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { CollectionDetail } from "@/types/collection";
import { createSWRWrapper } from "../../helpers/swr-wrapper";

const originalFetch = globalThis.fetch;

const mockCollection: CollectionDetail = {
  id: "col-1",
  userId: "player-1",
  name: "Best RPGs",
  slug: "best-rpgs",
  description: "My favorite RPGs of all time",
  isPublic: true,
  createdAt: "2024-01-15T00:00:00Z",
  updatedAt: "2024-02-01T00:00:00Z",
  owner: {
    id: "player-1",
    fullName: "John Doe",
    avatarUrl: "/avatar.jpg",
  },
  items: [
    {
      id: "item-1",
      gameId: "game-1",
      slug: "final-fantasy-vii",
      title: "Final Fantasy VII",
      coverImage: "/ff7.jpg",
      genres: [{ name: "RPG" }],
      note: "A classic",
      position: 0,
      addedAt: "2024-01-20T00:00:00Z",
    },
  ],
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

import { useCollectionDetail } from "@/hooks/useCollectionDetail";

describe("useCollectionDetail", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn(() => Promise.resolve(jsonResponse({ collection: mockCollection })));
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should initialize with loading state", () => {
    const { result } = renderHook(() => useCollectionDetail("player-1", "best-rpgs"), {
      wrapper: createSWRWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.collection).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.notFound).toBe(false);
  });

  it("should fetch collection detail successfully", async () => {
    const { result } = renderHook(() => useCollectionDetail("player-1", "best-rpgs"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.collection).toEqual(mockCollection);
    expect(result.current.error).toBeNull();
    expect(result.current.notFound).toBe(false);
  });

  it("should set notFound on 404 response", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve(jsonResponse({ error: "Collection not found" }, 404))
    );

    const { result } = renderHook(() => useCollectionDetail("player-1", "nonexistent"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notFound).toBe(true);
    expect(result.current.collection).toBeNull();
    // Pas d'error quand c'est un 404 (notFound gère ce cas)
    expect(result.current.error).toBeNull();
  });

  it("should handle non-404 error response", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve(jsonResponse({ error: "Internal server error" }, 500))
    );

    const { result } = renderHook(() => useCollectionDetail("player-1", "best-rpgs"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.collection).toBeNull();
    expect(result.current.notFound).toBe(false);
  });

  it("should handle network error", async () => {
    mockFetch.mockImplementation(() => Promise.reject(new TypeError("fetch failed")));

    const { result } = renderHook(() => useCollectionDetail("player-1", "best-rpgs"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.collection).toBeNull();
  });

  it("should not fetch when playerId is empty", async () => {
    const { result } = renderHook(() => useCollectionDetail("", "best-rpgs"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.collection).toBeNull();
  });

  it("should not fetch when slug is empty", async () => {
    const { result } = renderHook(() => useCollectionDetail("player-1", ""), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.collection).toBeNull();
  });
});
