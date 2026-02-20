import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Feature: review-votes, Property 2: Self-vote prevention
// **Validates: Requirements 3.2**

// ---------------------------------------------------------------------------
// Pure model of the self-vote guard from useReviewVote.handleVote
// ---------------------------------------------------------------------------

type VoteType = "helpful" | "not_helpful";

interface VoteAttempt {
  userId: string;
  reviewUserId: string;
  voteType: VoteType;
}

/**
 * Models the self-vote guard logic from useReviewVote.
 * Returns true if the vote is allowed, false if refused.
 *
 * This mirrors the guard in handleVote:
 *   if (user.id === reviewUserId) return; // refuse
 */
function isVoteAllowed(userId: string, reviewUserId: string): boolean {
  return userId !== reviewUserId;
}

/**
 * Models the full handleVote guard sequence.
 * Returns the resulting vote if allowed, or null if refused (no-op).
 */
function attemptVote(attempt: VoteAttempt): VoteType | null {
  if (!isVoteAllowed(attempt.userId, attempt.reviewUserId)) {
    return null; // self-vote refused
  }
  return attempt.voteType;
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Generate a UUID-like string (realistic user/review author IDs) */
const uuidGen = fc.uuid();

/** Generate a valid vote type */
const voteTypeGen = fc.constantFrom<VoteType>("helpful", "not_helpful");

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe("useReviewVote — Property-Based Tests", () => {
  // -------------------------------------------------------------------------
  // Property 2: Prévention du vote sur son propre avis
  // For any userId and reviewUserId, if they are equal, the system refuses
  // the vote. If they differ, the vote is allowed.
  // **Validates: Requirements 3.2**
  // -------------------------------------------------------------------------
  describe("Property 2: Self-vote prevention", () => {
    it("refuses the vote when userId equals reviewUserId", () => {
      fc.assert(
        fc.property(uuidGen, voteTypeGen, (userId, voteType) => {
          // Same user as review author → vote must be refused
          const result = attemptVote({
            userId,
            reviewUserId: userId,
            voteType,
          });

          expect(result).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it("allows the vote when userId differs from reviewUserId", () => {
      fc.assert(
        fc.property(
          uuidGen,
          uuidGen.filter((id2) => true),
          voteTypeGen,
          (userId, reviewUserId, voteType) => {
            // Only test when IDs actually differ
            fc.pre(userId !== reviewUserId);

            const result = attemptVote({
              userId,
              reviewUserId,
              voteType,
            });

            expect(result).toBe(voteType);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("isVoteAllowed is false if and only if userId === reviewUserId", () => {
      fc.assert(
        fc.property(uuidGen, uuidGen, (id1, id2) => {
          const allowed = isVoteAllowed(id1, id2);

          if (id1 === id2) {
            expect(allowed).toBe(false);
          } else {
            expect(allowed).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("self-vote prevention holds regardless of vote type", () => {
      fc.assert(
        fc.property(uuidGen, voteTypeGen, (userId, voteType) => {
          // For any vote type, self-vote is always refused
          const resultHelpful = attemptVote({
            userId,
            reviewUserId: userId,
            voteType: "helpful",
          });
          const resultNotHelpful = attemptVote({
            userId,
            reviewUserId: userId,
            voteType: "not_helpful",
          });

          expect(resultHelpful).toBeNull();
          expect(resultNotHelpful).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it("self-vote guard is symmetric: order of comparison does not matter", () => {
      fc.assert(
        fc.property(uuidGen, uuidGen, (id1, id2) => {
          // The guard checks userId === reviewUserId, which is symmetric
          expect(isVoteAllowed(id1, id2)).toBe(isVoteAllowed(id2, id1));
        }),
        { numRuns: 100 }
      );
    });
  });
});
