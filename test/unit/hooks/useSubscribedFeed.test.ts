import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSubscribedFeed } from "@/hooks/useSubscribedFeed";

const mockFeedResponse = {
  events: [
    {
      id: "e1",
      type: "review",
      date: "2026-04-18T00:00:00Z",
      data: {
        type: "review",
        gameSlug: "game-1",
        gameName: "Game 1",
        rating: 18,
        contentExcerpt: "Great",
        actor: { id: "u1", username: "alice", avatarUrl: null },
      },
    },
  ],
  pagination: { currentPage: 1, totalPages: 1, hasNextPage: false },
};

describe("useSubscribedFeed", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockFeedResponse),
    });
  });

  it("returns loading initially", () => {
    const { result } = renderHook(() => useSubscribedFeed("viewer-1", "fr"));
    expect(result.current.isLoading).toBe(true);
  });

  it("returns feed events after fetch", async () => {
    const { result } = renderHook(() => useSubscribedFeed("viewer-1", "fr"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.events).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("handles error responses", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Server error" }),
    });

    const { result } = renderHook(() => useSubscribedFeed("viewer-1", "fr"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toContain("Server error");
  });
});
