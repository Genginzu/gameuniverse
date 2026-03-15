import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

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
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should debounce search and call API after 300ms", async () => {
    vi.useFakeTimers();
    globalThis.fetch = createDefaultFetch();

    const { usePlayerAchievementManager } = await import("@/hooks/usePlayerAchievementManager");
    const { result } = renderHook(() => usePlayerAchievementManager());

    act(() => {
      result.current.searchPlayers("ali");
    });

    // Not called yet (debounce pending)
    const callsBefore = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(callsBefore).toBe(0);

    // Advance past debounce and flush microtasks
    await act(async () => {
      vi.advanceTimersByTime(300);
      // Let the promise chain resolve
      await vi.runAllTimersAsync();
    });

    vi.useRealTimers();

    await waitFor(
      () => {
        expect(result.current.searchLoading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.players).toEqual(mockPlayers);
    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(1);
    const searchUrl = (calls[0] as unknown[])[0] as string;
    expect(searchUrl).toContain("/players/search");
    expect(searchUrl).toContain("q=ali");
  });

  it("should clear results when search query is empty", async () => {
    globalThis.fetch = createDefaultFetch();

    const { usePlayerAchievementManager } = await import("@/hooks/usePlayerAchievementManager");
    const { result } = renderHook(() => usePlayerAchievementManager());

    act(() => {
      result.current.searchPlayers("");
    });

    expect(result.current.players).toEqual([]);
    expect(result.current.searchLoading).toBe(false);
  });

  it("should set selectedPlayer and fetch achievements on selectPlayer", async () => {
    globalThis.fetch = createDefaultFetch();

    const { usePlayerAchievementManager } = await import("@/hooks/usePlayerAchievementManager");
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

    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const fetchUrl = (calls[0] as unknown[])[0] as string;
    expect(fetchUrl).toContain("/players");
    expect(fetchUrl).toContain("userId=u1");
  });

  it("should assign achievement via POST and refresh", async () => {
    globalThis.fetch = createDefaultFetch();

    const { usePlayerAchievementManager } = await import("@/hooks/usePlayerAchievementManager");
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

    await act(async () => {
      await result.current.assignAchievement("new_achievement");
    });

    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const postCall = calls.find(
      (call) => (call as unknown[])[1] && ((call as unknown[])[1] as RequestInit).method === "POST"
    );
    expect(postCall).toBeDefined();
    const body = JSON.parse(((postCall as unknown[])[1] as RequestInit).body as string);
    expect(body).toEqual({ userId: "u1", achievementKey: "new_achievement" });
  });

  it("should revoke achievement via DELETE and refresh", async () => {
    globalThis.fetch = createDefaultFetch();

    const { usePlayerAchievementManager } = await import("@/hooks/usePlayerAchievementManager");
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

    await act(async () => {
      await result.current.revokeAchievement("first_game");
    });

    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const deleteCall = calls.find(
      (call) =>
        (call as unknown[])[1] && ((call as unknown[])[1] as RequestInit).method === "DELETE"
    );
    expect(deleteCall).toBeDefined();
    const body = JSON.parse(((deleteCall as unknown[])[1] as RequestInit).body as string);
    expect(body).toEqual({ userId: "u1", achievementKey: "first_game" });
  });

  it("should throw when assigning without a selected player", async () => {
    globalThis.fetch = createDefaultFetch();

    const { usePlayerAchievementManager } = await import("@/hooks/usePlayerAchievementManager");
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
    vi.useFakeTimers();
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Search failed" }),
      })
    ) as unknown as typeof fetch;

    const { usePlayerAchievementManager } = await import("@/hooks/usePlayerAchievementManager");
    const { result } = renderHook(() => usePlayerAchievementManager());

    act(() => {
      result.current.searchPlayers("test");
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
      await vi.runAllTimersAsync();
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

    const { usePlayerAchievementManager } = await import("@/hooks/usePlayerAchievementManager");
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
