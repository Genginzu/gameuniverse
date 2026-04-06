import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePlayerPosts } from "@/hooks/usePlayerPosts";

const mockPostsResponse = {
  posts: [{ id: "p1", content: "Hello world", createdAt: "2024-01-01" }],
  pagination: { currentPage: 1, totalPages: 1, hasNextPage: false },
};

describe("usePlayerPosts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPostsResponse),
    });
  });

  it("returns loading initially", () => {
    const { result } = renderHook(() => usePlayerPosts("player-1"));
    expect(result.current.isLoading).toBe(true);
  });

  it("returns posts after fetch", async () => {
    const { result } = renderHook(() => usePlayerPosts("player-1"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.posts).toEqual(mockPostsResponse.posts);
    expect(result.current.error).toBeNull();
  });

  it("handles error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Server error" }),
    });

    const { result } = renderHook(() => usePlayerPosts("player-1"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("Server error");
  });
});
