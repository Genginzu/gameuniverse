import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReviewService } from "@/lib/services/reviewService";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("ReviewService", () => {
  it("fetchReviews calls GET with gameId", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reviews: [], averageRating: 0 }),
    });
    const result = await ReviewService.fetchReviews("g1");
    expect(result).toEqual({ reviews: [], averageRating: 0 });
    expect(fetch).toHaveBeenCalledWith("/api/reviews?gameId=g1");
  });

  it("submitReview sends POST", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    const result = await ReviewService.submitReview("g1", { rating: 5, title: "Great", content: "Nice" } as any);
    expect(result).toEqual({ success: true });
    expect(fetch).toHaveBeenCalledWith("/api/reviews", expect.objectContaining({ method: "POST" }));
  });

  it("updateReview sends PUT", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    const result = await ReviewService.updateReview("g1", { rating: 4, title: "OK", content: "Fine" } as any);
    expect(result).toEqual({ success: true });
    expect(fetch).toHaveBeenCalledWith("/api/reviews", expect.objectContaining({ method: "PUT" }));
  });

  it("fetchReviews throws on error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Server error" }),
    });
    await expect(ReviewService.fetchReviews("g1")).rejects.toThrow("Server error");
  });
});
