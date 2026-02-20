import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  computeCollaborativeScore,
  type CollaborativeScoreInput,
} from "@/lib/services/recommendation/collaborativeScorer";

/**
 * Feature: game-recommendations, Property 3: Collaborative score with status filtering
 *
 * _For any_ source game and candidate game, the Collaborative_Score should be
 * computed only from Player_Library entries with status "owned", "completed", or
 * "playing". Entries with status "wishlist" should not contribute to the
 * co-occurrence count. When fewer than 2 libraries contain the source game, the
 * Collaborative_Score should be 0.
 *
 * **Validates: Requirements 2.1, 2.3, 2.2**
 */

// --- Generators ---

const gameIdGen = fc.uuid();

/** Co-occurrence count: number of libraries containing both games (valid statuses only) */
const coOccurrenceCountGen = fc.integer({ min: 0, max: 1000 });

/** Source game library count: total libraries containing the source game */
const sourceGameLibraryCountGen = fc.integer({ min: 0, max: 1000 });

/** Input generator with coOccurrence always <= sourceGameLibraryCount (realistic constraint) */
const validInputGen = fc
  .record({
    sourceGameId: gameIdGen,
    candidateGameId: gameIdGen,
    sourceGameLibraryCount: fc.integer({ min: 0, max: 1000 }),
  })
  .chain(({ sourceGameId, candidateGameId, sourceGameLibraryCount }) =>
    fc.record({
      sourceGameId: fc.constant(sourceGameId),
      candidateGameId: fc.constant(candidateGameId),
      coOccurrenceCount: fc.integer({
        min: 0,
        max: Math.max(0, sourceGameLibraryCount),
      }),
      sourceGameLibraryCount: fc.constant(sourceGameLibraryCount),
    })
  );

// --- Tests ---

describe("collaborativeScorer - Property-Based Tests", () => {
  describe("Property 3: Collaborative score with status filtering", () => {
    it("returns 0 when fewer than 2 libraries contain the source game", () => {
      fc.assert(
        fc.property(
          gameIdGen,
          gameIdGen,
          coOccurrenceCountGen,
          fc.integer({ min: 0, max: 1 }),
          (sourceGameId, candidateGameId, coOccurrenceCount, sourceGameLibraryCount) => {
            const score = computeCollaborativeScore({
              sourceGameId,
              candidateGameId,
              coOccurrenceCount,
              sourceGameLibraryCount,
            });
            expect(score).toBe(0);
          }
        ),
        { numRuns: 200 }
      );
    });

    it("computes score as coOccurrenceCount / sourceGameLibraryCount when >= 2 libraries", () => {
      fc.assert(
        fc.property(validInputGen, (input) => {
          fc.pre(input.sourceGameLibraryCount >= 2);
          fc.pre(input.coOccurrenceCount > 0);

          const score = computeCollaborativeScore(input);
          const expected = input.coOccurrenceCount / input.sourceGameLibraryCount;
          expect(score).toBeCloseTo(expected, 10);
        }),
        { numRuns: 200 }
      );
    });

    it("returns 0 when co-occurrence count is 0 (no shared libraries with valid statuses)", () => {
      fc.assert(
        fc.property(
          gameIdGen,
          gameIdGen,
          fc.integer({ min: 2, max: 1000 }),
          (sourceGameId, candidateGameId, sourceGameLibraryCount) => {
            const score = computeCollaborativeScore({
              sourceGameId,
              candidateGameId,
              coOccurrenceCount: 0,
              sourceGameLibraryCount,
            });
            expect(score).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("returns a value in [0, 1] for any valid input", () => {
      fc.assert(
        fc.property(validInputGen, (input) => {
          const score = computeCollaborativeScore(input);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(1);
        }),
        { numRuns: 200 }
      );
    });

    it("score increases monotonically with co-occurrence count (fixed library count)", () => {
      fc.assert(
        fc.property(
          gameIdGen,
          gameIdGen,
          fc.integer({ min: 2, max: 1000 }),
          (sourceGameId, candidateGameId, sourceGameLibraryCount) => {
            const base: Omit<CollaborativeScoreInput, "coOccurrenceCount"> = {
              sourceGameId,
              candidateGameId,
              sourceGameLibraryCount,
            };

            const scoreLow = computeCollaborativeScore({
              ...base,
              coOccurrenceCount: 1,
            });
            const scoreHigh = computeCollaborativeScore({
              ...base,
              coOccurrenceCount: Math.min(
                sourceGameLibraryCount,
                Math.max(2, Math.floor(sourceGameLibraryCount / 2))
              ),
            });

            expect(scoreHigh).toBeGreaterThanOrEqual(scoreLow);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("wishlist-only scenario: score is 0 when coOccurrenceCount excludes wishlist entries", () => {
      // This test models the scenario where all co-occurrences come from
      // "wishlist" status entries. Since the function receives pre-filtered
      // counts (only valid statuses), passing coOccurrenceCount=0 simulates
      // that wishlist entries were correctly excluded upstream.
      fc.assert(
        fc.property(
          gameIdGen,
          gameIdGen,
          fc.integer({ min: 2, max: 1000 }),
          (sourceGameId, candidateGameId, sourceGameLibraryCount) => {
            const score = computeCollaborativeScore({
              sourceGameId,
              candidateGameId,
              coOccurrenceCount: 0, // all entries were wishlist → filtered out
              sourceGameLibraryCount,
            });
            expect(score).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
