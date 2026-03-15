import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAchievements } from "@/hooks/useAchievements";
import type { PlayerAchievementWithDetails, PlayerXpStats } from "@/types/achievement";

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

describe("useAchievements", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn((url: string) => {
      if (url.includes("/achievements")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ achievements: mockAchievements }),
        });
      }
      if (url.includes("/xp")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockXpStats),
        });
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should initialize with loading state", () => {
    const { result } = renderHook(() => useAchievements("player-1", "fr"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.achievements).toEqual([]);
    expect(result.current.xpStats).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should fetch achievements and xp stats in parallel", async () => {
    const { result } = renderHook(() => useAchievements("player-1", "fr"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.achievements).toEqual(mockAchievements);
    expect(result.current.xpStats).toEqual(mockXpStats);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("should pass locale as query param to achievements endpoint", async () => {
    const { result } = renderHook(() => useAchievements("player-1", "en"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/players/player-1/achievements?locale=en",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("should handle achievements endpoint error", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/achievements")) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: "Player not found" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockXpStats),
      });
    });

    const { result } = renderHook(() => useAchievements("bad-id", "fr"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Player not found");
  });

  it("should handle xp endpoint error", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/achievements")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ achievements: mockAchievements }),
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "XP fetch failed" }),
      });
    });

    const { result } = renderHook(() => useAchievements("player-1", "fr"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("XP fetch failed");
  });

  it("should handle network error", async () => {
    mockFetch.mockImplementation(() => Promise.reject(new Error("Network error")));

    const { result } = renderHook(() => useAchievements("player-1", "fr"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.achievements).toEqual([]);
    expect(result.current.xpStats).toBeNull();
  });

  it("should not fetch when playerId is empty", async () => {
    const { result } = renderHook(() => useAchievements("", "fr"));

    // Give a tick for the effect to run (or not)
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
