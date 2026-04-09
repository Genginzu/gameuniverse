import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePlayerAchievementManager } from "@/hooks/usePlayerAchievementManager";

const originalFetch = globalThis.fetch;

const mockPlayers = [
  { id: "u1", username: "alice", avatarUrl: null },
  { id: "u2", username: "bob", avatarUrl: "https://example.com/bob.png" },
];

const mockPlayerAchievements = ["first_game", "reviewer"];

function createDefaultFetch() {
  return vi.fn((url: string, options?: RequestInit) => {
    if (typeof url === "string" && url.includes("/players/search")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ players: mockPlayers }),
      });
    }
    if (typeof url === "string" && url.includes("/players") && !options?.method) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ achievements: mockPlayerAchievements }),
      });
    }
    if (options?.method === "POST") {
      return Promise.resolve({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ success: true }),
      });
    }
    if (options?.method === "DELETE") {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
  }) as unknown as typeof fetch;
}

describe("usePlayerAchievementManager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.fetch = originalFetch;
  });

  it("should debounce search and call API after 300ms", async () => {
    globalThis.fetch = createDefaultFetch();

    const { result } = renderHook(() => usePlayerAchievementManager());

    act(() => {
      result.current.searchPlayers("ali");
    });

    // Not called yet (debounce pending)
    expect(globalThis.fetch).not.toHaveBeenCalled();

    // Advance past debounce
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    vi.useRealTimers();

    await waitFor(
      () => {
        expect(result.current.searchLoading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.players).toEqual(mockPlayers);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const searchUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(searchUrl).toContain("/players/search");
    expect(searchUrl).toContain("q=ali");
  });

  it("should clear results when search query is empty", () => {
    globalThis.fetch = createDefaultFetch();

    const { result } = renderHook(() => usePlayerAchievementManager());

    act(() => {
      result.current.searchPlayers("");
    });

    expect(result.current.players).toEqual([]);
    expect(result.current.searchLoading).toBe(false);
  });

  it("should set selectedPlayer and fetch achievements on selectPlayer", async () => {
    vi.useRealTimers();
    globalThis.fetch = createDefaultFetch();

    const { result } = renderHook(() => usePlayerAchievementManager());

    await act(async () => {
      await result.current.selectPlayer(mockPlayers[0]);
    });

    await waitFor(
      () => {
        expect(result.current.achievementsLoading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.selectedPlayer).toEqual(mockPlayers[0]);
    expect(result.current.playerAchievements).toEqual(mockPlayerAchievements);
  });

  it("should assign achievement via POST and refresh", async () => {
    vi.useRealTimers();
    globalThis.fetch = createDefaultFetch();

    const { result } = renderHook(() => usePlayerAchievementManager());

    await act(async () => {
      await result.current.selectPlayer(mockPlayers[0]);
    });

    await waitFor(() => {
      expect(result.current.achievementsLoading).toBe(false);
    });

    await act(async () => {
      await result.current.assignAchievement("new_achievement");
    });

    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
    const postCall = calls.find(
      (call) => call[1] && (call[1] as RequestInit).method === "POST"
    );
    expect(postCall).toBeDefined();
    const body = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(body).toEqual({ userId: "u1", achievementKey: "new_achievement" });
  });

  it("should revoke achievement via DELETE and refresh", async () => {
    vi.useRealTimers();
    globalThis.fetch = createDefaultFetch();

    const { result } = renderHook(() => usePlayerAchievementManager());

    await act(async () => {
      await result.current.selectPlayer(mockPlayers[0]);
    });

    await waitFor(() => {
      expect(result.current.achievementsLoading).toBe(false);
    });

    await act(async () => {
      await result.current.revokeAchievement("first_game");
    });

    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
    const deleteCall = calls.find(
      (call) => call[1] && (call[1] as RequestInit).method === "DELETE"
    );
    expect(deleteCall).toBeDefined();
    const body = JSON.parse((deleteCall![1] as RequestInit).body as string);
    expect(body).toEqual({ userId: "u1", achievementKey: "first_game" });
  });

  it("should throw when assigning without a selected player", async () => {
    vi.useRealTimers();
    globalThis.fetch = createDefaultFetch();

    const { result } = renderHook(() => usePlayerAchievementManager());

    let caughtError: Error | null = null;
    try {
      await act(async () => {
        await result.current.assignAchievement("some_key");
      });
    } catch (err) {
      caughtError = err as Error;
    }

    expect(caughtError).toBeInstanceOf(Error);
    expect(caughtError?.message).toBe("No player selected");
  });

  it("should handle search failure", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Search failed" }),
      })
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => usePlayerAchievementManager());

    act(() => {
      result.current.searchPlayers("test");
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    vi.useRealTimers();

    await waitFor(
      () => {
        expect(result.current.searchLoading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Search failed");
  });

  it("should handle assign failure", async () => {
    vi.useRealTimers();
    globalThis.fetch = vi.fn((url: string, options?: RequestInit) => {
      if (options?.method === "POST") {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ error: "Achievement already assigned" }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ achievements: mockPlayerAchievements }),
      });
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => usePlayerAchievementManager());

    await act(async () => {
      await result.current.selectPlayer(mockPlayers[0]);
    });

    await waitFor(() => {
      expect(result.current.achievementsLoading).toBe(false);
    });

    let caughtError: Error | null = null;
    try {
      await act(async () => {
        await result.current.assignAchievement("first_game");
      });
    } catch (err) {
      caughtError = err as Error;
    }

    expect(caughtError).toBeInstanceOf(Error);
    expect(caughtError?.message).toBe("Achievement already assigned");
  });
});
