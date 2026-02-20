import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { CollectionDetail } from "@/types/collection";

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

// Import once at module level
import { useCollectionDetail } from "@/hooks/useCollectionDetail";

describe("useCollectionDetail", () => {
  let mockFetch: ReturnType<typeof mock>;

  beforeEach(() => {
    mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ collection: mockCollection }),
      })
    );
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should initialize with loading state", async () => {
    const { result } = renderHook(() => useCollectionDetail("player-1", "best-rpgs"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.collection).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.notFound).toBe(false);
  });

  it("should fetch collection detail successfully", async () => {
    const { result } = renderHook(() => useCollectionDetail("player-1", "best-rpgs"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.collection).toEqual(mockCollection);
    expect(result.current.error).toBeNull();
    expect(result.current.notFound).toBe(false);
    expect(mockFetch).toHaveBeenCalledWith("/api/players/player-1/collections/best-rpgs?locale=fr");
  });

  it("should set notFound on 404 response", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "Collection not found" }),
      })
    );

    const { result } = renderHook(() => useCollectionDetail("player-1", "nonexistent"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notFound).toBe(true);
    expect(result.current.collection).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should handle non-404 error response", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Internal server error" }),
      })
    );

    const { result } = renderHook(() => useCollectionDetail("player-1", "best-rpgs"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to fetch collection detail");
    expect(result.current.collection).toBeNull();
    expect(result.current.notFound).toBe(false);
  });

  it("should handle network error", async () => {
    mockFetch.mockImplementation(() => Promise.reject(new Error("Network error")));

    const { result } = renderHook(() => useCollectionDetail("player-1", "best-rpgs"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.collection).toBeNull();
  });

  it("should not fetch when playerId is empty", async () => {
    const { result } = renderHook(() => useCollectionDetail("", "best-rpgs"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.collection).toBeNull();
  });

  it("should not fetch when slug is empty", async () => {
    const { result } = renderHook(() => useCollectionDetail("player-1", ""));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.collection).toBeNull();
  });

  it("should handle missing collection in response", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      })
    );

    const { result } = renderHook(() => useCollectionDetail("player-1", "best-rpgs"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.collection).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
