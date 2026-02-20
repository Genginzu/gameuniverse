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

import { usePersonalRecommendations } from "@/hooks/usePersonalRecommendations";

describe("usePersonalRecommendations", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            recommendations: mockRecommendations,
            basedOnGameCount: 5,
            generatedAt: "2024-01-01T00:00:00.000Z",
          }),
      })
    );
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should initialize with loading state", async () => {
    const { result } = renderHook(() => usePersonalRecommendations());

    expect(result.current.loading).toBe(true);
    expect(result.current.recommendations).toEqual([]);
    expect(result.current.basedOnGameCount).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it("should fetch personal recommendations successfully", async () => {
    const { result } = renderHook(() => usePersonalRecommendations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.recommendations).toEqual(mockRecommendations);
    expect(result.current.basedOnGameCount).toBe(5);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith("/api/recommendations/personal");
  });

  it("should handle non-ok response", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "Unauthorized" }),
      })
    );

    const { result } = renderHook(() => usePersonalRecommendations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to fetch personal recommendations");
    expect(result.current.recommendations).toEqual([]);
  });

  it("should handle network error", async () => {
    mockFetch.mockImplementation(() => Promise.reject(new Error("Network error")));

    const { result } = renderHook(() => usePersonalRecommendations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.recommendations).toEqual([]);
  });

  it("should handle missing fields in response", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );

    const { result } = renderHook(() => usePersonalRecommendations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.recommendations).toEqual([]);
    expect(result.current.basedOnGameCount).toBe(0);
    expect(result.current.error).toBeNull();
  });
});
