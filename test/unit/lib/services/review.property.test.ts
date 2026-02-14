import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import { computeAverageRating, sortReviewsByDateDesc } from "../../../../src/app/api/reviews/route";

// --- Generators ---

/** Generate a valid ISO date string using integer timestamps */
const isoDateGen = fc
  .integer({ min: 1577836800000, max: 1893456000000 }) // 2020-01-01 to 2030-01-01
  .map((ts) => new Date(ts).toISOString());

/** Generate a review-like object with a createdAt date */
const reviewWithDateGen = fc.record({
  createdAt: isoDateGen,
  rating: fc.integer({ min: 0, max: 20 }),
});

/** Generate a non-empty list of reviews with dates */
const reviewListGen = fc.array(reviewWithDateGen, { minLength: 1, maxLength: 50 });

/**
 * Feature: game-reviews, Property 7: Tri des reviews par date décroissante
 *
 * For any list of reviews returned by the sort function,
 * the creation dates must be in descending order (most recent first).
 *
 * **Validates: Requirements 5.1**
 */
describe("Property 7: Tri des reviews par date décroissante", () => {
  it("sorts reviews so that each date is >= the next one", () => {
    fc.assert(
      fc.property(reviewListGen, (reviews) => {
        const sorted = sortReviewsByDateDesc(reviews);

        // Every consecutive pair must be in descending order
        for (let i = 0; i < sorted.length - 1; i++) {
          const current = new Date(sorted[i].createdAt).getTime();
          const next = new Date(sorted[i + 1].createdAt).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("preserves all elements (no reviews lost or duplicated)", () => {
    fc.assert(
      fc.property(reviewListGen, (reviews) => {
        const sorted = sortReviewsByDateDesc(reviews);
        expect(sorted.length).toBe(reviews.length);
      }),
      { numRuns: 100 }
    );
  });

  it("returns an empty array for empty input", () => {
    const sorted = sortReviewsByDateDesc([]);
    expect(sorted).toEqual([]);
  });
});

/**
 * Feature: game-reviews, Property 8: Calcul correct de la note moyenne
 *
 * For any non-empty list of reviews with ratings, the average rating returned
 * must equal the sum of ratings divided by the number of reviews.
 *
 * **Validates: Requirements 5.4**
 */
describe("Property 8: Calcul correct de la note moyenne", () => {
  it("computes the correct average for any non-empty list of ratings", () => {
    const ratingsGen = fc.array(fc.integer({ min: 0, max: 20 }), {
      minLength: 1,
      maxLength: 50,
    });

    fc.assert(
      fc.property(ratingsGen, (ratings) => {
        const reviews = ratings.map((rating) => ({ rating }));
        const avg = computeAverageRating(reviews);

        const expectedSum = ratings.reduce((acc, r) => acc + r, 0);
        const expectedAvg = expectedSum / ratings.length;

        expect(avg).not.toBeNull();
        // Use closeTo to handle floating point precision
        expect(avg!).toBeCloseTo(expectedAvg, 10);
      }),
      { numRuns: 100 }
    );
  });

  it("returns null for an empty list", () => {
    expect(computeAverageRating([])).toBeNull();
  });

  it("returns the exact rating for a single review", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 20 }), (rating) => {
        const avg = computeAverageRating([{ rating }]);
        expect(avg).toBe(rating);
      }),
      { numRuns: 100 }
    );
  });
});
