import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { GameRecommendation } from "@/types/recommendation";

const originalFetch = globalThis.fetch;

const mockRecommendations: GameRecommendation[] = [
  {
    id: "game-1",
    slug: "elden-ring",
    title: "Elden Ring",
    coverImage: "/covers/elden-ring.jpg",
    genres: [{ id: "g1", name: "RPG" }],
    developer: "FromSoftware",
    combinedScore: 0.85,
  },
  {
    id: "game-2",
    slug: "dark-souls",
    title: "Dark Souls",
    coverImage: null,
    genres: [
      { id: "g1", name: "RPG" },
      { id: "g2", name: "Action" },
    ],
    developer: "FromSoftware",
    combinedScore: 0.72,
  },
];

import { useRecommendations } from "@/hooks/useRecommendations";

describe("useRecommendations", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ recommendations: mockRecommendations }),
      })
    );
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should initialize with loading state", async () => {
    const { result } = renderHook(() => useRecommendations("zelda-totk"));

    expect(result.current.loading).toBe(true);
    expect(result.current.recommendations).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should fetch recommendations successfully", async () => {
    const { result } = renderHook(() => useRecommendations("zelda-totk"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.recommendations).toEqual(mockRecommendations);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith("/api/games/zelda-totk/recommendations");
  });

  it("should handle non-ok response", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "Game not found" }),
      })
    );

    const { result } = renderHook(() => useRecommendations("nonexistent"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to fetch recommendations");
    expect(result.current.recommendations).toEqual([]);
  });

  it("should handle network error", async () => {
    mockFetch.mockImplementation(() => Promise.reject(new Error("Network error")));

    const { result } = renderHook(() => useRecommendations("zelda-totk"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.recommendations).toEqual([]);
  });

  it("should not fetch when gameSlug is empty", async () => {
    const { result } = renderHook(() => useRecommendations(""));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.recommendations).toEqual([]);
  });

  it("should handle missing recommendations in response", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );

    const { result } = renderHook(() => useRecommendations("zelda-totk"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.recommendations).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
