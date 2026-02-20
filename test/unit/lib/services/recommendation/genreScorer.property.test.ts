import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { computeGenreScore, type GenreScoreInput } from "@/lib/services/recommendation/genreScorer";

/**
 * Feature: game-recommendations, Property 1: Jaccard coefficient correctness
 *
 * _For any_ two non-empty sets of genre IDs (source and candidate), the
 * Genre_Score should equal the size of their intersection divided by the size
 * of their union. When both sets are empty, the score should be 0. When the
 * intersection is empty, the score should be 0.
 *
 * **Validates: Requirements 1.1, 1.2**
 */

// --- Generators ---

/** Genre ID generator using UUIDs */
const genreIdGen = fc.uuid();

/** Non-empty array of unique genre IDs */
const nonEmptyGenreSetGen = fc.uniqueArray(genreIdGen, { minLength: 1, maxLength: 20 });

/** Possibly empty array of unique genre IDs */
const genreSetGen = fc.uniqueArray(genreIdGen, { minLength: 0, maxLength: 20 });

// --- Helpers ---

/** Reference Jaccard implementation for verification */
function referenceJaccard(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  let intersection = 0;
  for (const id of setA) {
    if (setB.has(id)) intersection++;
  }
  return intersection / union.size;
}

// --- Tests ---

describe("genreScorer - Property-Based Tests", () => {
  describe("Property 1: Jaccard coefficient correctness", () => {
    it("matches the reference Jaccard coefficient for any two non-empty genre sets", () => {
      fc.assert(
        fc.property(nonEmptyGenreSetGen, nonEmptyGenreSetGen, (source, candidate) => {
          const score = computeGenreScore({
            sourceGenreIds: source,
            candidateGenreIds: candidate,
          });
          const expected = referenceJaccard(source, candidate);
          expect(score).toBeCloseTo(expected, 10);
        }),
        { numRuns: 200 }
      );
    });

    it("returns 0 when both sets are empty", () => {
      const score = computeGenreScore({
        sourceGenreIds: [],
        candidateGenreIds: [],
      });
      expect(score).toBe(0);
    });

    it("returns 0 when the intersection is empty (disjoint sets)", () => {
      fc.assert(
        fc.property(nonEmptyGenreSetGen, nonEmptyGenreSetGen, (source, candidate) => {
          // Make sets disjoint by prefixing IDs
          const disjointSource = source.map((id) => `src-${id}`);
          const disjointCandidate = candidate.map((id) => `cand-${id}`);

          const score = computeGenreScore({
            sourceGenreIds: disjointSource,
            candidateGenreIds: disjointCandidate,
          });
          expect(score).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it("returns a value in [0, 1] for any inputs", () => {
      fc.assert(
        fc.property(genreSetGen, genreSetGen, (source, candidate) => {
          const score = computeGenreScore({
            sourceGenreIds: source,
            candidateGenreIds: candidate,
          });
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(1);
        }),
        { numRuns: 200 }
      );
    });

    it("returns 1 when both sets are identical and non-empty", () => {
      fc.assert(
        fc.property(nonEmptyGenreSetGen, (genres) => {
          const score = computeGenreScore({
            sourceGenreIds: genres,
            candidateGenreIds: [...genres],
          });
          expect(score).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it("is symmetric: score(A, B) === score(B, A)", () => {
      fc.assert(
        fc.property(genreSetGen, genreSetGen, (source, candidate) => {
          const scoreAB = computeGenreScore({
            sourceGenreIds: source,
            candidateGenreIds: candidate,
          });
          const scoreBA = computeGenreScore({
            sourceGenreIds: candidate,
            candidateGenreIds: source,
          });
          expect(scoreAB).toBeCloseTo(scoreBA, 10);
        }),
        { numRuns: 200 }
      );
    });

    it("handles duplicate genre IDs by treating them as sets", () => {
      fc.assert(
        fc.property(nonEmptyGenreSetGen, nonEmptyGenreSetGen, (source, candidate) => {
          // Duplicate each ID to simulate duplicates in input
          const duplicatedSource = [...source, ...source];
          const duplicatedCandidate = [...candidate, ...candidate];

          const scoreClean = computeGenreScore({
            sourceGenreIds: source,
            candidateGenreIds: candidate,
          });
          const scoreDuped = computeGenreScore({
            sourceGenreIds: duplicatedSource,
            candidateGenreIds: duplicatedCandidate,
          });
          expect(scoreDuped).toBeCloseTo(scoreClean, 10);
        }),
        { numRuns: 100 }
      );
    });
  });
});
