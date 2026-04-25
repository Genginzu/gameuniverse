import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { usePlayerSessions } from "@/hooks/usePlayerSessions";

const mockSessionsResponse = {
  sessions: [
    {
      id: "s1",
      userId: "u1",
      gameId: "g1",
      gameSlug: "witcher-3",
      gameName: "The Witcher 3",
      coverImage: null,
      startedAt: "2026-04-20T12:00:00Z",
      endedAt: "2026-04-20T13:30:00Z",
      durationMinutes: 90,
      createdAt: "2026-04-20T14:00:00Z",
    },
  ],
  pagination: { currentPage: 1, totalPages: 1, totalCount: 1, hasNextPage: false },
};

describe("usePlayerSessions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSessionsResponse),
    });
  });

  it("returns loading initially", () => {
    const { result } = renderHook(() => usePlayerSessions("player-1", "fr"));
    expect(result.current.isLoading).toBe(true);
  });

  it("returns sessions after fetch", async () => {
    const { result } = renderHook(() => usePlayerSessions("player-1", "fr"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0].durationMinutes).toBe(90);
    expect(result.current.error).toBeNull();
  });

  it("handles error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Server error" }),
    });
    const { result } = renderHook(() => usePlayerSessions("player-1", "fr"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("Server error");
  });

  it("prepends the new session after createSession", async () => {
    const { result } = renderHook(() => usePlayerSessions("player-1", "fr"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "s2",
          userId: "player-1",
          gameId: "g2",
          gameSlug: "elden-ring",
          gameName: "Elden Ring",
          coverImage: null,
          startedAt: "2026-04-20T12:00:00Z",
          endedAt: "2026-04-20T13:00:00Z",
          durationMinutes: 60,
          createdAt: "2026-04-20T14:30:00Z",
        }),
    });

    await act(async () => {
      await result.current.createSession({
        gameId: "g2",
        date: "2026-04-20",
        durationMinutes: 60,
      });
    });

    expect(result.current.sessions).toHaveLength(2);
    expect(result.current.sessions[0].id).toBe("s2");
  });

  it("removes a session after deleteSession", async () => {
    const { result } = renderHook(() => usePlayerSessions("player-1", "fr"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    await act(async () => {
      await result.current.deleteSession("s1");
    });

    expect(result.current.sessions).toHaveLength(0);
  });
});
