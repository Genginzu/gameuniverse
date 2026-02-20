import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { computeCombinedScore } from "@/lib/services/recommendation/scoreCombiner";
import type { CandidateScores, ScoringWeights } from "@/types/recommendation";

/**
 * Feature: game-recommendations, Property 5: Combined score is a weighted sum
 *
 * _For any_ three scores (genre, collaborative, review) in [0, 1] and any
 * positive weights (w1, w2, w3), the Combined_Score should equal
 * `(w1 * genreScore + w2 * collaborativeScore + w3 * reviewScore) / (w1 + w2 + w3)`.
 *
 * **Validates: Requirements 4.1, 3.1**
 */

// --- Generators ---

/** Score in [0, 1] — excludes NaN/Infinity */
const scoreGen = fc.double({ min: 0, max: 1, noNaN: true });

/** Positive weight (strictly > 0) — excludes NaN/Infinity */
const positiveWeightGen = fc.double({
  min: Number.EPSILON,
  max: 100,
  noNaN: true,
});

/** CandidateScores with all scores in [0, 1] */
const candidateScoresGen: fc.Arbitrary<CandidateScores> = fc.record({
  genreScore: scoreGen,
  collaborativeScore: scoreGen,
  reviewScore: scoreGen,
});

/** ScoringWeights with all positive weights */
const positiveWeightsGen: fc.Arbitrary<ScoringWeights> = fc.record({
  genre: positiveWeightGen,
  collaborative: positiveWeightGen,
  review: positiveWeightGen,
});

// --- Helpers ---

/** Reference weighted-sum implementation */
function referenceWeightedSum(scores: CandidateScores, weights: ScoringWeights): number {
  const totalWeight = weights.genre + weights.collaborative + weights.review;
  if (totalWeight === 0) return 0;
  return (
    (weights.genre * scores.genreScore +
      weights.collaborative * scores.collaborativeScore +
      weights.review * scores.reviewScore) /
    totalWeight
  );
}

// --- Tests ---

describe("scoreCombiner - Property-Based Tests", () => {
  describe("Property 5: Combined score is a weighted sum", () => {
    it("equals the reference weighted sum for any scores in [0,1] and positive weights", () => {
      fc.assert(
        fc.property(candidateScoresGen, positiveWeightsGen, (scores, weights) => {
          const result = computeCombinedScore(scores, weights);
          const expected = referenceWeightedSum(scores, weights);
          expect(result).toBeCloseTo(expected, 10);
        }),
        { numRuns: 200 }
      );
    });

    it("produces a result in [0, 1] when all scores are in [0, 1] and weights are positive", () => {
      fc.assert(
        fc.property(candidateScoresGen, positiveWeightsGen, (scores, weights) => {
          const result = computeCombinedScore(scores, weights);
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(1);
        }),
        { numRuns: 200 }
      );
    });

    it("returns 0 when all weights are zero", () => {
      const zeroWeights: ScoringWeights = {
        genre: 0,
        collaborative: 0,
        review: 0,
      };
      fc.assert(
        fc.property(candidateScoresGen, (scores) => {
          const result = computeCombinedScore(scores, zeroWeights);
          expect(result).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it("returns the single non-zero-weighted score when only one weight is positive", () => {
      fc.assert(
        fc.property(candidateScoresGen, positiveWeightGen, (scores, w) => {
          // Only genre weight is positive
          const genreOnly: ScoringWeights = {
            genre: w,
            collaborative: 0,
            review: 0,
          };
          expect(computeCombinedScore(scores, genreOnly)).toBeCloseTo(scores.genreScore, 10);

          // Only collaborative weight is positive
          const collabOnly: ScoringWeights = {
            genre: 0,
            collaborative: w,
            review: 0,
          };
          expect(computeCombinedScore(scores, collabOnly)).toBeCloseTo(
            scores.collaborativeScore,
            10
          );

          // Only review weight is positive
          const reviewOnly: ScoringWeights = {
            genre: 0,
            collaborative: 0,
            review: w,
          };
          expect(computeCombinedScore(scores, reviewOnly)).toBeCloseTo(scores.reviewScore, 10);
        }),
        { numRuns: 100 }
      );
    });

    it("is invariant to uniform scaling of weights", () => {
      fc.assert(
        fc.property(
          candidateScoresGen,
          positiveWeightsGen,
          fc.double({ min: 0.01, max: 1000, noNaN: true }),
          (scores, weights, scaleFactor) => {
            const scaledWeights: ScoringWeights = {
              genre: weights.genre * scaleFactor,
              collaborative: weights.collaborative * scaleFactor,
              review: weights.review * scaleFactor,
            };
            const original = computeCombinedScore(scores, weights);
            const scaled = computeCombinedScore(scores, scaledWeights);
            expect(scaled).toBeCloseTo(original, 8);
          }
        ),
        { numRuns: 200 }
      );
    });
  });
});
