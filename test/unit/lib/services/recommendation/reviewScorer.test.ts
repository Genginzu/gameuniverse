import { describe, it, expect } from "vitest";
import {
  computeReviewScore,
  type ReviewScoreInput,
} from "@/lib/services/recommendation/reviewScorer";

describe("computeReviewScore", () => {
  const defaults = { minReviewsForFullConfidence: 3 };

  it("returns 0.5 (neutral) when averageRating is null", () => {
    const input: ReviewScoreInput = {
      averageRating: null,
      reviewCount: 0,
      ...defaults,
    };
    expect(computeReviewScore(input)).toBe(0.5);
  });

  it("returns 0.5 (neutral) when reviewCount is 0", () => {
    const input: ReviewScoreInput = {
      averageRating: 15,
      reviewCount: 0,
      ...defaults,
    };
    expect(computeReviewScore(input)).toBe(0.5);
  });

  it("returns full normalized rating when reviewCount >= minReviewsForFullConfidence", () => {
    const input: ReviewScoreInput = {
      averageRating: 16,
      reviewCount: 5,
      ...defaults,
    };
    // 16/20 = 0.8
    expect(computeReviewScore(input)).toBe(0.8);
  });

  it("applies confidence discount when reviewCount < minReviewsForFullConfidence", () => {
    const input: ReviewScoreInput = {
      averageRating: 20,
      reviewCount: 1,
      ...defaults,
    };
    // normalizedRating = 1.0, discount = 1/3
    // 0.5 + (1.0 - 0.5) * (1/3) = 0.5 + 0.1667 ≈ 0.6667
    expect(computeReviewScore(input)).toBeCloseTo(0.5 + 0.5 * (1 / 3), 10);
  });

  it("applies proportional discount for 2 reviews out of 3", () => {
    const input: ReviewScoreInput = {
      averageRating: 20,
      reviewCount: 2,
      ...defaults,
    };
    // normalizedRating = 1.0, discount = 2/3
    // 0.5 + (1.0 - 0.5) * (2/3) = 0.5 + 0.3333 ≈ 0.8333
    expect(computeReviewScore(input)).toBeCloseTo(0.5 + 0.5 * (2 / 3), 10);
  });

  it("returns exactly minReviewsForFullConfidence boundary (no discount)", () => {
    const input: ReviewScoreInput = {
      averageRating: 10,
      reviewCount: 3,
      ...defaults,
    };
    // 10/20 = 0.5 → neutral, so score = 0.5
    expect(computeReviewScore(input)).toBe(0.5);
  });

  it("handles a rating of 0 with full confidence", () => {
    const input: ReviewScoreInput = {
      averageRating: 0,
      reviewCount: 10,
      ...defaults,
    };
    // 0/20 = 0, full confidence → 0.5 + (0 - 0.5) * 1 = 0
    expect(computeReviewScore(input)).toBe(0);
  });

  it("handles a rating of 0 with low confidence (pulled toward neutral)", () => {
    const input: ReviewScoreInput = {
      averageRating: 0,
      reviewCount: 1,
      ...defaults,
    };
    // normalizedRating = 0, discount = 1/3
    // 0.5 + (0 - 0.5) * (1/3) = 0.5 - 0.1667 ≈ 0.3333
    expect(computeReviewScore(input)).toBeCloseTo(0.5 - 0.5 * (1 / 3), 10);
  });

  it("clamps rating above 20 to 20", () => {
    const input: ReviewScoreInput = {
      averageRating: 25,
      reviewCount: 5,
      ...defaults,
    };
    // clamped to 20/20 = 1.0
    expect(computeReviewScore(input)).toBe(1);
  });

  it("clamps negative rating to 0", () => {
    const input: ReviewScoreInput = {
      averageRating: -5,
      reviewCount: 5,
      ...defaults,
    };
    // clamped to 0/20 = 0
    expect(computeReviewScore(input)).toBe(0);
  });
});
