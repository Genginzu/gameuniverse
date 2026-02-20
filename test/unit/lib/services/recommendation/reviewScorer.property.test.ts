import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  computeReviewScore,
  type ReviewScoreInput,
} from "@/lib/services/recommendation/reviewScorer";

/**
 * Feature: game-recommendations, Property 4: Review score confidence discount
 *
 * _For any_ candidate game with a review count below the minimum confidence
 * threshold (3), the Review_Score should be discounted proportionally to
 * `reviewCount / minReviewsForFullConfidence`. When a game has no reviews,
 * the Review_Score should be 0.5 (neutral).
 *
 * **Validates: Requirements 3.3, 3.2**
 */

// --- Constants ---

const NEUTRAL_SCORE = 0.5;
const MAX_RATING = 20;
const DEFAULT_MIN_REVIEWS = 3;

// --- Generators ---

/** Rating on the 0-20 scale */
const ratingGen = fc.float({ min: 0, max: MAX_RATING, noNaN: true });

/** Review count below the confidence threshold (1 or 2 for default threshold 3) */
const lowReviewCountGen = fc.integer({ min: 1, max: DEFAULT_MIN_REVIEWS - 1 });

/** Review count at or above the confidence threshold */
const highReviewCountGen = fc.integer({ min: DEFAULT_MIN_REVIEWS, max: 10000 });

/** Positive review count */
const positiveReviewCountGen = fc.integer({ min: 1, max: 10000 });

/** minReviewsForFullConfidence — always at least 1 to avoid division by zero */
const minReviewsGen = fc.integer({ min: 1, max: 100 });

// --- Helpers ---

/** Reference implementation for review score */
function referenceReviewScore(
  averageRating: number,
  reviewCount: number,
  minReviewsForFullConfidence: number
): number {
  const normalizedRating = Math.max(0, Math.min(averageRating, MAX_RATING)) / MAX_RATING;
  const confidence =
    reviewCount >= minReviewsForFullConfidence ? 1 : reviewCount / minReviewsForFullConfidence;
  return NEUTRAL_SCORE + (normalizedRating - NEUTRAL_SCORE) * confidence;
}

// --- Tests ---

describe("reviewScorer - Property-Based Tests", () => {
  describe("Property 4: Review score confidence discount", () => {
    it("returns neutral score (0.5) when averageRating is null (no reviews)", () => {
      fc.assert(
        fc.property(positiveReviewCountGen, minReviewsGen, (reviewCount, minReviews) => {
          const score = computeReviewScore({
            averageRating: null,
            reviewCount,
            minReviewsForFullConfidence: minReviews,
          });
          expect(score).toBe(NEUTRAL_SCORE);
        }),
        { numRuns: 100 }
      );
    });

    it("returns neutral score (0.5) when reviewCount is 0", () => {
      fc.assert(
        fc.property(ratingGen, minReviewsGen, (rating, minReviews) => {
          const score = computeReviewScore({
            averageRating: rating,
            reviewCount: 0,
            minReviewsForFullConfidence: minReviews,
          });
          expect(score).toBe(NEUTRAL_SCORE);
        }),
        { numRuns: 100 }
      );
    });

    it("applies confidence discount proportional to reviewCount / minReviewsForFullConfidence when below threshold", () => {
      fc.assert(
        fc.property(ratingGen, minReviewsGen, (rating, minReviews) => {
          // Generate a review count strictly below the threshold
          const reviewCount = Math.max(1, Math.floor(minReviews / 2));
          if (reviewCount >= minReviews) return; // skip if threshold is 1

          const score = computeReviewScore({
            averageRating: rating,
            reviewCount,
            minReviewsForFullConfidence: minReviews,
          });

          const expected = referenceReviewScore(rating, reviewCount, minReviews);
          expect(score).toBeCloseTo(expected, 10);

          // Verify the discount is actually applied: score should be closer to
          // neutral than the full-confidence score
          const fullConfidenceScore = referenceReviewScore(rating, minReviews, minReviews);
          const distanceFromNeutral = Math.abs(score - NEUTRAL_SCORE);
          const fullDistance = Math.abs(fullConfidenceScore - NEUTRAL_SCORE);
          expect(distanceFromNeutral).toBeLessThanOrEqual(fullDistance + 1e-10);
        }),
        { numRuns: 200 }
      );
    });

    it("gives full confidence (no discount) when reviewCount >= minReviewsForFullConfidence", () => {
      fc.assert(
        fc.property(ratingGen, highReviewCountGen, (rating, reviewCount) => {
          const score = computeReviewScore({
            averageRating: rating,
            reviewCount,
            minReviewsForFullConfidence: DEFAULT_MIN_REVIEWS,
          });

          // With full confidence, score = normalizedRating
          const normalizedRating = Math.max(0, Math.min(rating, MAX_RATING)) / MAX_RATING;
          expect(score).toBeCloseTo(normalizedRating, 10);
        }),
        { numRuns: 200 }
      );
    });

    it("always returns a value in [0, 1]", () => {
      fc.assert(
        fc.property(
          fc.option(ratingGen, { nil: null }),
          fc.integer({ min: 0, max: 10000 }),
          minReviewsGen,
          (rating, reviewCount, minReviews) => {
            const score = computeReviewScore({
              averageRating: rating,
              reviewCount,
              minReviewsForFullConfidence: minReviews,
            });
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 200 }
      );
    });

    it("discount is monotonically increasing with reviewCount", () => {
      fc.assert(
        fc.property(ratingGen, minReviewsGen, (rating, minReviews) => {
          // Compare score with 1 review vs score with minReviews - 1 reviews
          if (minReviews < 2) return; // need at least 2 to compare

          const scoreLow = computeReviewScore({
            averageRating: rating,
            reviewCount: 1,
            minReviewsForFullConfidence: minReviews,
          });
          const scoreHigh = computeReviewScore({
            averageRating: rating,
            reviewCount: minReviews - 1,
            minReviewsForFullConfidence: minReviews,
          });

          // More reviews → score further from neutral (or equal)
          const distLow = Math.abs(scoreLow - NEUTRAL_SCORE);
          const distHigh = Math.abs(scoreHigh - NEUTRAL_SCORE);
          expect(distHigh).toBeGreaterThanOrEqual(distLow - 1e-10);
        }),
        { numRuns: 200 }
      );
    });
  });
});
