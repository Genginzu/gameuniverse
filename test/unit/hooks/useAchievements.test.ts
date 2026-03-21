import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAchievements } from "@/hooks/useAchievements";
import type { PlayerAchievementWithDetails, PlayerXpStats } from "@/types/achievement";
import { createSWRWrapper } from "../../helpers/swr-wrapper";

const originalFetch = globalThis.fetch;

const mockAchievements: PlayerAchievementWithDetails[] = [
  {
    key: "library_1",
    category: "library",
    tier: "bronze",
    threshold: 1,
    xpValue: 10,
    icon: "BookOpen",
    name: "Premier jeu",
    description: "Ajouter un premier jeu",
    unlockedAt: "2024-01-15T10:00:00Z",
    sortOrder: 1,
  },
  {
    key: "library_5",
    category: "library",
    tier: "bronze",
    threshold: 5,
    xpValue: 25,
    icon: "BookOpen",
    name: "Collectionneur débutant",
    description: "Ajouter 5 jeux",
    unlockedAt: null,
    sortOrder: 2,
  },
];

const mockXpStats: PlayerXpStats = {
  xpTotal: 10,
  level: 2,
  currentLevelXp: 10,
  nextLevelXp: 45,
  progressPercent: 28,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("useAchievements", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn((url: string) => {
      if (url.includes("/achievements")) {
        return Promise.resolve(jsonResponse({ achievements: mockAchievements }));
      }
      if (url.includes("/xp")) {
        return Promise.resolve(jsonResponse(mockXpStats));
      }
      return Promise.resolve(jsonResponse({}, 404));
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should initialize with loading state", () => {
    const { result } = renderHook(() => useAchievements("player-1", "fr"), {
      wrapper: createSWRWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.achievements).toEqual([]);
    expect(result.current.xpStats).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should fetch achievements and xp stats in parallel", async () => {
    const { result } = renderHook(() => useAchievements("player-1", "fr"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.achievements).toEqual(mockAchievements);
    expect(result.current.xpStats).toEqual(mockXpStats);
    expect(result.current.error).toBeNull();
  });

  it("should handle achievements endpoint error", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/achievements")) {
        return Promise.resolve(jsonResponse({ error: "Player not found" }, 404));
      }
      return Promise.resolve(jsonResponse(mockXpStats));
    });

    const { result } = renderHook(() => useAchievements("bad-id", "fr"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });

  it("should handle xp endpoint error", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/achievements")) {
        return Promise.resolve(jsonResponse({ achievements: mockAchievements }));
      }
      return Promise.resolve(jsonResponse({ error: "XP fetch failed" }, 500));
    });

    const { result } = renderHook(() => useAchievements("player-1", "fr"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it("should handle network error", async () => {
    mockFetch.mockImplementation(() => Promise.reject(new TypeError("fetch failed")));

    const { result } = renderHook(() => useAchievements("player-1", "fr"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.achievements).toEqual([]);
    expect(result.current.xpStats).toBeNull();
  });

  it("should not fetch when playerId is empty", async () => {
    const { result } = renderHook(() => useAchievements("", "fr"), {
      wrapper: createSWRWrapper(),
    });

    // SWR key null → pas de fetch, isLoading = false
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.achievements).toEqual([]);
  });
});
