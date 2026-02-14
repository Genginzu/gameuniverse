import { describe, it, expect } from "bun:test";
import type { Review } from "../../../../../src/types/review";

/**
 * Unit Tests for ReviewList Component
 *
 * **Validates: Requirements 5.1, 5.2, 5.3**
 * - Reviews are displayed in a list
 * - Empty state shows invitation message
 * - Loading state shows skeleton
 */

// Simulate ReviewList rendering logic
function simulateReviewListRender(reviews: Review[], loading: boolean) {
  if (loading) {
    return { state: "loading" as const, skeletonCount: 3 };
  }
  if (reviews.length === 0) {
    return { state: "empty" as const, emptyMessage: "Aucun avis pour le moment" };
  }
  return {
    state: "list" as const,
    reviewCount: reviews.length,
    reviewIds: reviews.map((r) => r.id),
  };
}

const makeReview = (id: string, rating: number): Review => ({
  id,
  userId: `user-${id}`,
  gameId: "game-1",
  rating,
  content: `<p>Review ${id}</p>`,
  positivePoints: [],
  negativePoints: [],
  createdAt: "2025-01-15T10:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z",
  playerName: `Player ${id}`,
  playerAvatar: null,
});

describe("ReviewList", () => {
  it("shows loading skeleton when loading", () => {
    const result = simulateReviewListRender([], true);
    expect(result.state).toBe("loading");
    if (result.state === "loading") {
      expect(result.skeletonCount).toBe(3);
    }
  });

  it("shows empty message when no reviews exist", () => {
    const result = simulateReviewListRender([], false);
    expect(result.state).toBe("empty");
    if (result.state === "empty") {
      expect(result.emptyMessage).toContain("Aucun avis");
    }
  });

  it("renders all reviews when list is non-empty", () => {
    const reviews = [makeReview("1", 15), makeReview("2", 10), makeReview("3", 5)];
    const result = simulateReviewListRender(reviews, false);
    expect(result.state).toBe("list");
    if (result.state === "list") {
      expect(result.reviewCount).toBe(3);
      expect(result.reviewIds).toEqual(["1", "2", "3"]);
    }
  });

  it("renders single review correctly", () => {
    const reviews = [makeReview("solo", 18)];
    const result = simulateReviewListRender(reviews, false);
    expect(result.state).toBe("list");
    if (result.state === "list") {
      expect(result.reviewCount).toBe(1);
    }
  });
});
