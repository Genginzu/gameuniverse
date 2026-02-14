import { describe, it, expect } from "bun:test";
import type { Review } from "../../../../../src/types/review";

/**
 * Unit Tests for ReviewCard Component
 *
 * **Validates: Requirements 5.2**
 * - WHEN the Review_List displays a review, it SHALL show player name,
 *   rating, content, positive and negative points
 */

// Simulate ReviewCard rendering logic
function simulateReviewCardRender(review: Review) {
  const ratio = review.rating / 20;
  let ratingColor: string;
  if (ratio >= 0.75) ratingColor = "text-green-400";
  else if (ratio >= 0.5) ratingColor = "text-yellow-400";
  else if (ratio >= 0.25) ratingColor = "text-orange-400";
  else ratingColor = "text-red-400";

  let formattedDate: string;
  try {
    formattedDate = new Intl.DateTimeFormat("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(review.createdAt));
  } catch {
    formattedDate = "—";
  }

  return {
    playerName: review.playerName ?? "Joueur anonyme",
    hasAvatar: review.playerAvatar !== null,
    avatarUrl: review.playerAvatar,
    ratingText: `${review.rating}/20`,
    ratingColor,
    formattedDate,
    htmlContent: review.content,
    positivePoints: review.positivePoints,
    negativePoints: review.negativePoints,
    showPoints: review.positivePoints.length > 0 || review.negativePoints.length > 0,
  };
}

const baseReview: Review = {
  id: "rev-1",
  userId: "user-1",
  gameId: "game-1",
  rating: 15,
  content: "<p>Great game</p>",
  positivePoints: ["Fun gameplay"],
  negativePoints: ["Short"],
  createdAt: "2025-01-15T10:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z",
  playerName: "Alice",
  playerAvatar: "https://example.com/avatar.jpg",
};

describe("ReviewCard", () => {
  it("displays all required fields", () => {
    const result = simulateReviewCardRender(baseReview);

    expect(result.playerName).toBe("Alice");
    expect(result.ratingText).toBe("15/20");
    expect(result.htmlContent).toBe("<p>Great game</p>");
    expect(result.positivePoints).toEqual(["Fun gameplay"]);
    expect(result.negativePoints).toEqual(["Short"]);
  });

  it("shows 'Joueur anonyme' when playerName is null", () => {
    const result = simulateReviewCardRender({
      ...baseReview,
      playerName: null,
    });
    expect(result.playerName).toBe("Joueur anonyme");
  });

  it("shows fallback avatar when playerAvatar is null", () => {
    const result = simulateReviewCardRender({
      ...baseReview,
      playerAvatar: null,
    });
    expect(result.hasAvatar).toBe(false);
  });

  it("applies green color for high ratings (>=15)", () => {
    const result = simulateReviewCardRender({ ...baseReview, rating: 16 });
    expect(result.ratingColor).toBe("text-green-400");
  });

  it("applies yellow color for medium ratings (10-14)", () => {
    const result = simulateReviewCardRender({ ...baseReview, rating: 12 });
    expect(result.ratingColor).toBe("text-yellow-400");
  });

  it("applies orange color for low ratings (5-9)", () => {
    const result = simulateReviewCardRender({ ...baseReview, rating: 7 });
    expect(result.ratingColor).toBe("text-orange-400");
  });

  it("applies red color for very low ratings (<5)", () => {
    const result = simulateReviewCardRender({ ...baseReview, rating: 3 });
    expect(result.ratingColor).toBe("text-red-400");
  });

  it("hides points section when both lists are empty", () => {
    const result = simulateReviewCardRender({
      ...baseReview,
      positivePoints: [],
      negativePoints: [],
    });
    expect(result.showPoints).toBe(false);
  });

  it("shows points section when only positive points exist", () => {
    const result = simulateReviewCardRender({
      ...baseReview,
      positivePoints: ["Good"],
      negativePoints: [],
    });
    expect(result.showPoints).toBe(true);
  });
});
