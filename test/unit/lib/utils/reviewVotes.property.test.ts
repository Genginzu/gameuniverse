import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  resolveVoteAfterClick,
  computeVoteCountsAfterChange,
} from "../../../../src/lib/utils/reviewVotes";
import type { VoteType, ReviewVoteCounts } from "../../../../src/types/review";

/**
 * Feature: review-votes
 * Property 1: Vote state transition consistency
 * **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3**
 */

// --- Generators ---

const voteTypeArb: fc.Arbitrary<VoteType> = fc.constantFrom(
  "helpful" as const,
  "not_helpful" as const
);

const currentVoteArb: fc.Arbitrary<VoteType | null> = fc.constantFrom(
  null,
  "helpful" as const,
  "not_helpful" as const
);

const nonNegativeCountsArb: fc.Arbitrary<ReviewVoteCounts> = fc.record({
  helpful: fc.integer({ min: 0, max: 1000 }),
  notHelpful: fc.integer({ min: 0, max: 1000 }),
});

describe("Review Votes Property-Based Tests", () => {
  describe("Property 1: Vote state transition consistency", () => {
    describe("resolveVoteAfterClick", () => {
      it("returns null when clicking the same vote type (toggle off)", () => {
        fc.assert(
          fc.property(voteTypeArb, (voteType) => {
            const result = resolveVoteAfterClick(voteType, voteType);
            expect(result).toBeNull();
          }),
          { numRuns: 100 }
        );
      });

      it("returns the clicked type when current vote differs", () => {
        fc.assert(
          fc.property(currentVoteArb, voteTypeArb, (currentVote, clickedType) => {
            const result = resolveVoteAfterClick(currentVote, clickedType);
            if (currentVote === clickedType) {
              expect(result).toBeNull();
            } else {
              expect(result).toBe(clickedType);
            }
          }),
          { numRuns: 100 }
        );
      });

      it("always returns null or a valid VoteType", () => {
        fc.assert(
          fc.property(currentVoteArb, voteTypeArb, (currentVote, clickedType) => {
            const result = resolveVoteAfterClick(currentVote, clickedType);
            expect(result === null || result === "helpful" || result === "not_helpful").toBe(true);
          }),
          { numRuns: 100 }
        );
      });
    });

    describe("computeVoteCountsAfterChange", () => {
      it("produces non-negative counters for any valid transition", () => {
        fc.assert(
          fc.property(
            nonNegativeCountsArb,
            currentVoteArb,
            currentVoteArb,
            (counts, previousVote, newVote) => {
              const result = computeVoteCountsAfterChange(counts, previousVote, newVote);
              expect(result.helpful).toBeGreaterThanOrEqual(0);
              expect(result.notHelpful).toBeGreaterThanOrEqual(0);
            }
          ),
          { numRuns: 100 }
        );
      });

      it("increments the new vote type counter when adding a vote (null → type)", () => {
        fc.assert(
          fc.property(nonNegativeCountsArb, voteTypeArb, (counts, newVoteType) => {
            const result = computeVoteCountsAfterChange(counts, null, newVoteType);
            if (newVoteType === "helpful") {
              expect(result.helpful).toBe(counts.helpful + 1);
              expect(result.notHelpful).toBe(counts.notHelpful);
            } else {
              expect(result.notHelpful).toBe(counts.notHelpful + 1);
              expect(result.helpful).toBe(counts.helpful);
            }
          }),
          { numRuns: 100 }
        );
      });

      it("decrements the old vote type counter when removing a vote (type → null)", () => {
        fc.assert(
          fc.property(nonNegativeCountsArb, voteTypeArb, (counts, previousVoteType) => {
            const result = computeVoteCountsAfterChange(counts, previousVoteType, null);
            if (previousVoteType === "helpful") {
              expect(result.helpful).toBe(Math.max(0, counts.helpful - 1));
              expect(result.notHelpful).toBe(counts.notHelpful);
            } else {
              expect(result.notHelpful).toBe(Math.max(0, counts.notHelpful - 1));
              expect(result.helpful).toBe(counts.helpful);
            }
          }),
          { numRuns: 100 }
        );
      });

      it("does not change the original counts object (immutability)", () => {
        fc.assert(
          fc.property(
            nonNegativeCountsArb,
            currentVoteArb,
            currentVoteArb,
            (counts, previousVote, newVote) => {
              const originalHelpful = counts.helpful;
              const originalNotHelpful = counts.notHelpful;

              computeVoteCountsAfterChange(counts, previousVote, newVote);

              expect(counts.helpful).toBe(originalHelpful);
              expect(counts.notHelpful).toBe(originalNotHelpful);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe("Total count coherence across transitions", () => {
      it("total changes by +1 when adding a vote (null → type)", () => {
        fc.assert(
          fc.property(nonNegativeCountsArb, voteTypeArb, (counts, newVoteType) => {
            const result = computeVoteCountsAfterChange(counts, null, newVoteType);
            const totalBefore = counts.helpful + counts.notHelpful;
            const totalAfter = result.helpful + result.notHelpful;
            expect(totalAfter - totalBefore).toBe(1);
          }),
          { numRuns: 100 }
        );
      });

      it("total changes by -1 when removing a vote (type → null)", () => {
        fc.assert(
          fc.property(nonNegativeCountsArb, voteTypeArb, (counts, previousVoteType) => {
            // Ensure the counter being decremented is > 0 for exact -1 check
            const adjustedCounts = { ...counts };
            if (previousVoteType === "helpful") {
              adjustedCounts.helpful = Math.max(1, counts.helpful);
            } else {
              adjustedCounts.notHelpful = Math.max(1, counts.notHelpful);
            }

            const result = computeVoteCountsAfterChange(adjustedCounts, previousVoteType, null);
            const totalBefore = adjustedCounts.helpful + adjustedCounts.notHelpful;
            const totalAfter = result.helpful + result.notHelpful;
            expect(totalAfter - totalBefore).toBe(-1);
          }),
          { numRuns: 100 }
        );
      });

      it("total stays the same when switching vote type (type → opposite type)", () => {
        fc.assert(
          fc.property(nonNegativeCountsArb, voteTypeArb, (counts, previousVoteType) => {
            const newVoteType: VoteType =
              previousVoteType === "helpful" ? "not_helpful" : "helpful";

            // Ensure the counter being decremented is > 0 for exact 0 check
            const adjustedCounts = { ...counts };
            if (previousVoteType === "helpful") {
              adjustedCounts.helpful = Math.max(1, counts.helpful);
            } else {
              adjustedCounts.notHelpful = Math.max(1, counts.notHelpful);
            }

            const result = computeVoteCountsAfterChange(
              adjustedCounts,
              previousVoteType,
              newVoteType
            );
            const totalBefore = adjustedCounts.helpful + adjustedCounts.notHelpful;
            const totalAfter = result.helpful + result.notHelpful;
            expect(totalAfter - totalBefore).toBe(0);
          }),
          { numRuns: 100 }
        );
      });

      it("total stays the same when no change (null → null)", () => {
        fc.assert(
          fc.property(nonNegativeCountsArb, (counts) => {
            const result = computeVoteCountsAfterChange(counts, null, null);
            const totalBefore = counts.helpful + counts.notHelpful;
            const totalAfter = result.helpful + result.notHelpful;
            expect(totalAfter - totalBefore).toBe(0);
          }),
          { numRuns: 100 }
        );
      });
    });

    describe("End-to-end: resolveVoteAfterClick + computeVoteCountsAfterChange", () => {
      it("full vote transition is coherent for any initial state and click", () => {
        fc.assert(
          fc.property(
            currentVoteArb,
            voteTypeArb,
            nonNegativeCountsArb,
            (currentVote, clickedType, counts) => {
              const newVote = resolveVoteAfterClick(currentVote, clickedType);
              const newCounts = computeVoteCountsAfterChange(counts, currentVote, newVote);

              // Counters are always non-negative
              expect(newCounts.helpful).toBeGreaterThanOrEqual(0);
              expect(newCounts.notHelpful).toBeGreaterThanOrEqual(0);

              // newVote is always null or a valid VoteType
              expect(newVote === null || newVote === "helpful" || newVote === "not_helpful").toBe(
                true
              );
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});
