import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { GameRecommendation } from "@/types/recommendation";
import { createSWRWrapper } from "../../helpers/swr-wrapper";

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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

import { usePersonalRecommendations } from "@/hooks/usePersonalRecommendations";

describe("usePersonalRecommendations", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn(() =>
      Promise.resolve(
        jsonResponse({
          recommendations: mockRecommendations,
          basedOnGameCount: 5,
          generatedAt: "2024-01-01T00:00:00.000Z",
        })
      )
    );
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should initialize with loading state", () => {
    const { result } = renderHook(() => usePersonalRecommendations(), {
      wrapper: createSWRWrapper(),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.recommendations).toEqual([]);
    expect(result.current.basedOnGameCount).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it("should fetch personal recommendations successfully", async () => {
    const { result } = renderHook(() => usePersonalRecommendations(), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.recommendations).toEqual(mockRecommendations);
    expect(result.current.basedOnGameCount).toBe(5);
    expect(result.current.error).toBeNull();
  });

  it("should handle non-ok response", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve(jsonResponse({ error: "Unauthorized" }, 401))
    );

    const { result } = renderHook(() => usePersonalRecommendations(), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.recommendations).toEqual([]);
  });

  it("should handle network error", async () => {
    mockFetch.mockImplementation(() => Promise.reject(new TypeError("fetch failed")));

    const { result } = renderHook(() => usePersonalRecommendations(), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.recommendations).toEqual([]);
  });
});
