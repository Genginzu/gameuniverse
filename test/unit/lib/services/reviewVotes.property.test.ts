import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { enrichReviewsWithVotes } from "../../../../src/lib/utils/reviewVoteQueries";
import type { Review, VoteType, ReviewVoteCounts } from "../../../../src/types/review";

/**
 * Feature: review-votes, Property 3: Vote response completeness
 * **Validates: Requirements 5.5**
 */

// --- Generators ---

const voteTypeArb: fc.Arbitrary<VoteType> = fc.constantFrom(
  "helpful" as const,
  "not_helpful" as const
);

const reviewArb: fc.Arbitrary<Review> = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  gameId: fc.uuid(),
  rating: fc.integer({ min: 1, max: 5 }),
  content: fc.string({ minLength: 1, maxLength: 200 }),
  positivePoints: fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
    minLength: 0,
    maxLength: 3,
  }),
  negativePoints: fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
    minLength: 0,
    maxLength: 3,
  }),
  createdAt: fc
    .integer({ min: 1577836800000, max: 1893456000000 })
    .map((ts) => new Date(ts).toISOString()),
  updatedAt: fc
    .integer({ min: 1577836800000, max: 1893456000000 })
    .map((ts) => new Date(ts).toISOString()),
  playerName: fc.option(fc.string({ minLength: 1, maxLength: 30 }), {
    nil: null,
  }),
  playerAvatar: fc.option(fc.string({ minLength: 1, maxLength: 100 }), {
    nil: null,
  }),
});

const voteCountsArb: fc.Arbitrary<ReviewVoteCounts> = fc.record({
  helpful: fc.integer({ min: 0, max: 1000 }),
  notHelpful: fc.integer({ min: 0, max: 1000 }),
});

describe("Review Votes Property-Based Tests", () => {
  describe("Property 3: Vote response completeness", () => {
    it("every enriched review has voteCounts with non-negative helpful and notHelpful", () => {
      fc.assert(
        fc.property(fc.array(reviewArb, { minLength: 1, maxLength: 20 }), (reviews) => {
          // Build a vote counts map with random counts for some reviews
          const voteCountsMap = new Map<string, ReviewVoteCounts>();
          const userVotesMap = new Map<string, VoteType>();

          const result = enrichReviewsWithVotes(reviews, voteCountsMap, userVotesMap);

          expect(result).toHaveLength(reviews.length);
          for (const enriched of result) {
            expect(enriched.voteCounts).toBeDefined();
            expect(enriched.voteCounts.helpful).toBeGreaterThanOrEqual(0);
            expect(enriched.voteCounts.notHelpful).toBeGreaterThanOrEqual(0);
          }
        }),
        { numRuns: 30 }
      );
    });

    it("userVote is null or a valid VoteType for every enriched review", () => {
      fc.assert(
        fc.property(
          fc.array(reviewArb, { minLength: 1, maxLength: 20 }),
          fc.array(fc.record({ reviewIndex: fc.nat(), voteType: voteTypeArb }), {
            minLength: 0,
            maxLength: 10,
          }),
          (reviews, userVoteEntries) => {
            const voteCountsMap = new Map<string, ReviewVoteCounts>();
            const userVotesMap = new Map<string, VoteType>();

            // Assign user votes to some reviews
            for (const entry of userVoteEntries) {
              const idx = entry.reviewIndex % reviews.length;
              userVotesMap.set(reviews[idx].id, entry.voteType);
            }

            const result = enrichReviewsWithVotes(reviews, voteCountsMap, userVotesMap);

            for (const enriched of result) {
              expect(
                enriched.userVote === null ||
                  enriched.userVote === "helpful" ||
                  enriched.userVote === "not_helpful"
              ).toBe(true);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("all original review fields are preserved in the enriched output", () => {
      fc.assert(
        fc.property(
          fc.array(reviewArb, { minLength: 1, maxLength: 20 }),
          fc.array(
            fc.record({
              reviewIndex: fc.nat(),
              counts: voteCountsArb,
            }),
            { minLength: 0, maxLength: 10 }
          ),
          fc.array(fc.record({ reviewIndex: fc.nat(), voteType: voteTypeArb }), {
            minLength: 0,
            maxLength: 10,
          }),
          (reviews, countEntries, userVoteEntries) => {
            const voteCountsMap = new Map<string, ReviewVoteCounts>();
            const userVotesMap = new Map<string, VoteType>();

            for (const entry of countEntries) {
              const idx = entry.reviewIndex % reviews.length;
              voteCountsMap.set(reviews[idx].id, entry.counts);
            }
            for (const entry of userVoteEntries) {
              const idx = entry.reviewIndex % reviews.length;
              userVotesMap.set(reviews[idx].id, entry.voteType);
            }

            const result = enrichReviewsWithVotes(reviews, voteCountsMap, userVotesMap);

            expect(result).toHaveLength(reviews.length);
            for (let i = 0; i < reviews.length; i++) {
              const original = reviews[i];
              const enriched = result[i];

              expect(enriched.id).toBe(original.id);
              expect(enriched.userId).toBe(original.userId);
              expect(enriched.gameId).toBe(original.gameId);
              expect(enriched.rating).toBe(original.rating);
              expect(enriched.content).toBe(original.content);
              expect(enriched.positivePoints).toEqual(original.positivePoints);
              expect(enriched.negativePoints).toEqual(original.negativePoints);
              expect(enriched.createdAt).toBe(original.createdAt);
              expect(enriched.updatedAt).toBe(original.updatedAt);
              expect(enriched.playerName).toBe(original.playerName);
              expect(enriched.playerAvatar).toBe(original.playerAvatar);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("reviews with vote counts in the map get those exact counts", () => {
      fc.assert(
        fc.property(
          fc.array(reviewArb, { minLength: 1, maxLength: 20 }),
          fc.array(
            fc.record({
              reviewIndex: fc.nat(),
              counts: voteCountsArb,
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (reviews, countEntries) => {
            const voteCountsMap = new Map<string, ReviewVoteCounts>();
            const userVotesMap = new Map<string, VoteType>();

            for (const entry of countEntries) {
              const idx = entry.reviewIndex % reviews.length;
              voteCountsMap.set(reviews[idx].id, entry.counts);
            }

            const result = enrichReviewsWithVotes(reviews, voteCountsMap, userVotesMap);

            for (const enriched of result) {
              const expectedCounts = voteCountsMap.get(enriched.id);
              if (expectedCounts) {
                expect(enriched.voteCounts).toEqual(expectedCounts);
              } else {
                expect(enriched.voteCounts).toEqual({
                  helpful: 0,
                  notHelpful: 0,
                });
              }
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("reviews without votes in the maps get default values (zero counts, null userVote)", () => {
      fc.assert(
        fc.property(fc.array(reviewArb, { minLength: 1, maxLength: 20 }), (reviews) => {
          const emptyCountsMap = new Map<string, ReviewVoteCounts>();
          const emptyVotesMap = new Map<string, VoteType>();

          const result = enrichReviewsWithVotes(reviews, emptyCountsMap, emptyVotesMap);

          for (const enriched of result) {
            expect(enriched.voteCounts).toEqual({
              helpful: 0,
              notHelpful: 0,
            });
            expect(enriched.userVote).toBeNull();
          }
        }),
        { numRuns: 30 }
      );
    });
  });
});
