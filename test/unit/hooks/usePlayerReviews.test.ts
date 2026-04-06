import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePlayerReviews } from "@/hooks/usePlayerReviews";

const mockReviewsResponse = {
  reviews: [{ id: "r1", rating: 8, content: "Great game" }],
  stats: { averageRating: 8, totalReviews: 1 },
  pagination: { currentPage: 1, totalPages: 1, hasNextPage: false },
};

describe("usePlayerReviews", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockReviewsResponse),
    });
  });

  it("returns loading initially", () => {
    const { result } = renderHook(() => usePlayerReviews("player-1", "fr"));
    expect(result.current.isLoading).toBe(true);
  });

  it("returns reviews after fetch", async () => {
    const { result } = renderHook(() => usePlayerReviews("player-1", "fr"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.reviews).toEqual(mockReviewsResponse.reviews);
    expect(result.current.stats).toEqual(mockReviewsResponse.stats);
    expect(result.current.error).toBeNull();
  });

  it("handles error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Server error" }),
    });

    const { result } = renderHook(() => usePlayerReviews("player-1", "fr"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("Server error");
  });
});
