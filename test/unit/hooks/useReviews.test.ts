import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createSWRWrapper } from "../../helpers/swr-wrapper";

vi.mock("@/lib/services/reviewService", () => ({
  ReviewService: {
    fetchReviews: vi.fn(),
    submitReview: vi.fn(),
    updateReview: vi.fn(),
  },
}));

import { useReviews } from "@/hooks/useReviews";
import { ReviewService } from "@/lib/services/reviewService";

const mockedFetchReviews = ReviewService.fetchReviews as ReturnType<typeof vi.fn>;
const mockedSubmitReview = ReviewService.submitReview as ReturnType<typeof vi.fn>;

const MOCK_RESPONSE = {
  reviews: [{ id: "r1", rating: 8, content: "Great game" }],
  averageRating: 8,
  totalCount: 1,
  userHasReviewed: false,
  userReview: null,
};

describe("useReviews", () => {
  beforeEach(() => {
    mockedFetchReviews.mockReset();
    mockedSubmitReview.mockReset();
    mockedFetchReviews.mockResolvedValue(MOCK_RESPONSE);
  });

  it("returns loading initially", () => {
    const { result } = renderHook(() => useReviews("game-1"), {
      wrapper: createSWRWrapper(),
    });
    expect(result.current.loading).toBe(true);
  });

  it("returns reviews data after fetch", async () => {
    const { result } = renderHook(() => useReviews("game-1"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.reviews).toEqual(MOCK_RESPONSE.reviews);
    expect(result.current.averageRating).toBe(8);
    expect(result.current.totalCount).toBe(1);
  });

  it("submitReview calls service and returns true on success", async () => {
    mockedSubmitReview.mockResolvedValue(undefined);

    const { result } = renderHook(() => useReviews("game-1"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let success: boolean;
    await act(async () => {
      success = await result.current.submitReview({ rating: 9, content: "Amazing" } as any);
    });

    expect(success!).toBe(true);
    expect(mockedSubmitReview).toHaveBeenCalledWith("game-1", { rating: 9, content: "Amazing" });
  });

  it("submitReview returns false and sets error on failure", async () => {
    mockedSubmitReview.mockRejectedValue(new Error("Submit failed"));

    const { result } = renderHook(() => useReviews("game-1"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let success: boolean;
    await act(async () => {
      success = await result.current.submitReview({ rating: 5, content: "Meh" } as any);
    });

    expect(success!).toBe(false);
    expect(result.current.error).toBe("Submit failed");
  });
});
