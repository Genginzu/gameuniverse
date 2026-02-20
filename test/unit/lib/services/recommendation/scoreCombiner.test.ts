import { describe, it, expect } from "vitest";
import { computeCombinedScore, DEFAULT_WEIGHTS } from "@/lib/services/recommendation/scoreCombiner";
import type { CandidateScores, ScoringWeights } from "@/types/recommendation";

describe("scoreCombiner", () => {
  describe("DEFAULT_WEIGHTS", () => {
    it("should have the expected default values", () => {
      expect(DEFAULT_WEIGHTS).toEqual({
        genre: 0.4,
        collaborative: 0.4,
        review: 0.2,
      });
    });

    it("should sum to 1.0", () => {
      const sum = DEFAULT_WEIGHTS.genre + DEFAULT_WEIGHTS.collaborative + DEFAULT_WEIGHTS.review;
      expect(sum).toBeCloseTo(1.0);
    });
  });

  describe("computeCombinedScore", () => {
    it("should return 0 when all scores are 0", () => {
      const scores: CandidateScores = {
        genreScore: 0,
        collaborativeScore: 0,
        reviewScore: 0,
      };
      expect(computeCombinedScore(scores)).toBe(0);
    });

    it("should return 1 when all scores are 1", () => {
      const scores: CandidateScores = {
        genreScore: 1,
        collaborativeScore: 1,
        reviewScore: 1,
      };
      expect(computeCombinedScore(scores)).toBeCloseTo(1);
    });

    it("should compute the normalized weighted sum with default weights", () => {
      const scores: CandidateScores = {
        genreScore: 0.8,
        collaborativeScore: 0.6,
        reviewScore: 0.5,
      };
      // (0.4*0.8 + 0.4*0.6 + 0.2*0.5) / (0.4+0.4+0.2) = (0.32+0.24+0.10) / 1.0 = 0.66
      expect(computeCombinedScore(scores)).toBeCloseTo(0.66);
    });

    it("should use custom weights when provided", () => {
      const scores: CandidateScores = {
        genreScore: 1,
        collaborativeScore: 0,
        reviewScore: 0,
      };
      const weights: ScoringWeights = {
        genre: 1,
        collaborative: 0,
        review: 0,
      };
      expect(computeCombinedScore(scores, weights)).toBeCloseTo(1);
    });

    it("should normalize by total weight when weights don't sum to 1", () => {
      const scores: CandidateScores = {
        genreScore: 1,
        collaborativeScore: 1,
        reviewScore: 1,
      };
      const weights: ScoringWeights = {
        genre: 2,
        collaborative: 2,
        review: 1,
      };
      // (2*1 + 2*1 + 1*1) / (2+2+1) = 5/5 = 1
      expect(computeCombinedScore(scores, weights)).toBeCloseTo(1);
    });

    it("should return 0 when all weights are 0", () => {
      const scores: CandidateScores = {
        genreScore: 0.8,
        collaborativeScore: 0.6,
        reviewScore: 0.5,
      };
      const weights: ScoringWeights = {
        genre: 0,
        collaborative: 0,
        review: 0,
      };
      expect(computeCombinedScore(scores, weights)).toBe(0);
    });

    it("should weight genre-only when other weights are 0", () => {
      const scores: CandidateScores = {
        genreScore: 0.7,
        collaborativeScore: 0.9,
        reviewScore: 0.3,
      };
      const weights: ScoringWeights = {
        genre: 1,
        collaborative: 0,
        review: 0,
      };
      // (1*0.7) / 1 = 0.7
      expect(computeCombinedScore(scores, weights)).toBeCloseTo(0.7);
    });
  });
});
