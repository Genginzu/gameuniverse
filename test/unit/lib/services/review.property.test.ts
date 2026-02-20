import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  computeAverageRating,
  sortReviewsByHelpfulVotes,
} from "../../../../src/app/api/reviews/route";

// --- Generators ---

/** Generate a valid ISO date string using integer timestamps */
const isoDateGen = fc
  .integer({ min: 1577836800000, max: 1893456000000 }) // 2020-01-01 to 2030-01-01
  .map((ts) => new Date(ts).toISOString());

/** Generate a review-like object with userId, voteCounts, and createdAt */
const reviewWithVotesGen = fc.record({
  userId: fc.uuid(),
  createdAt: isoDateGen,
  rating: fc.integer({ min: 0, max: 20 }),
  voteCounts: fc.record({
    helpful: fc.integer({ min: 0, max: 500 }),
  }),
});

/** Generate a non-empty list of reviews */
const reviewListGen = fc.array(reviewWithVotesGen, { minLength: 1, maxLength: 50 });

/**
 * Feature: game-reviews, Property 7: Tri des reviews par votes helpful décroissants
 *
 * For any list of reviews, the sort function must:
 * 1. Place the current user's review first (if present)
 * 2. Sort remaining reviews by helpful vote count descending
 * 3. Use date descending as tiebreaker
 *
 * **Validates: Requirements 5.1**
 */
describe("Property 7: Tri des reviews par votes helpful décroissants", () => {
  it("places the current user's review first when authenticated", () => {
    fc.assert(
      fc.property(reviewListGen, (reviews) => {
        // Pick a random userId from the list as the "current user"
        const currentUserId = reviews[0].userId;
        const sorted = sortReviewsByHelpfulVotes(reviews, currentUserId);

        const userReviewExists = reviews.some((r) => r.userId === currentUserId);
        if (userReviewExists) {
          expect(sorted[0].userId).toBe(currentUserId);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("sorts non-user reviews by helpful votes descending", () => {
    fc.assert(
      fc.property(reviewListGen, (reviews) => {
        // Use null so no user review is pinned — pure vote sorting
        const sorted = sortReviewsByHelpfulVotes(reviews, null);

        for (let i = 0; i < sorted.length - 1; i++) {
          expect(sorted[i].voteCounts.helpful).toBeGreaterThanOrEqual(
            sorted[i + 1].voteCounts.helpful
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  it("uses date descending as tiebreaker for equal helpful counts", () => {
    const fixedHelpful = fc.integer({ min: 0, max: 10 });

    fc.assert(
      fc.property(
        fixedHelpful,
        fc.array(isoDateGen, { minLength: 2, maxLength: 20 }),
        (helpful, dates) => {
          const reviews = dates.map((d, i) => ({
            userId: `user-${i}`,
            createdAt: d,
            rating: 10,
            voteCounts: { helpful },
          }));

          const sorted = sortReviewsByHelpfulVotes(reviews, null);

          for (let i = 0; i < sorted.length - 1; i++) {
            const current = new Date(sorted[i].createdAt).getTime();
            const next = new Date(sorted[i + 1].createdAt).getTime();
            expect(current).toBeGreaterThanOrEqual(next);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("preserves all elements (no reviews lost or duplicated)", () => {
    fc.assert(
      fc.property(reviewListGen, (reviews) => {
        const sorted = sortReviewsByHelpfulVotes(reviews, null);
        expect(sorted.length).toBe(reviews.length);
      }),
      { numRuns: 100 }
    );
  });

  it("returns an empty array for empty input", () => {
    const sorted = sortReviewsByHelpfulVotes([], null);
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
