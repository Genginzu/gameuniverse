import { describe, it, expect } from "vitest";
import { computeGenreScore, type GenreScoreInput } from "@/lib/services/recommendation/genreScorer";

describe("computeGenreScore", () => {
  it("returns 0 when both sets are empty", () => {
    const input: GenreScoreInput = {
      sourceGenreIds: [],
      candidateGenreIds: [],
    };
    expect(computeGenreScore(input)).toBe(0);
  });

  it("returns 0 when source is empty", () => {
    const input: GenreScoreInput = {
      sourceGenreIds: [],
      candidateGenreIds: ["g1", "g2"],
    };
    expect(computeGenreScore(input)).toBe(0);
  });

  it("returns 0 when candidate is empty", () => {
    const input: GenreScoreInput = {
      sourceGenreIds: ["g1", "g2"],
      candidateGenreIds: [],
    };
    expect(computeGenreScore(input)).toBe(0);
  });

  it("returns 0 when no genres are shared", () => {
    const input: GenreScoreInput = {
      sourceGenreIds: ["g1", "g2"],
      candidateGenreIds: ["g3", "g4"],
    };
    expect(computeGenreScore(input)).toBe(0);
  });

  it("returns 1 when sets are identical", () => {
    const input: GenreScoreInput = {
      sourceGenreIds: ["g1", "g2", "g3"],
      candidateGenreIds: ["g1", "g2", "g3"],
    };
    expect(computeGenreScore(input)).toBe(1);
  });

  it("computes correct Jaccard for partial overlap", () => {
    // source = {g1, g2, g3}, candidate = {g2, g3, g4}
    // intersection = {g2, g3} → 2
    // union = {g1, g2, g3, g4} → 4
    // Jaccard = 2/4 = 0.5
    const input: GenreScoreInput = {
      sourceGenreIds: ["g1", "g2", "g3"],
      candidateGenreIds: ["g2", "g3", "g4"],
    };
    expect(computeGenreScore(input)).toBe(0.5);
  });

  it("handles single shared genre", () => {
    // intersection = {g1} → 1, union = {g1, g2} → 2
    const input: GenreScoreInput = {
      sourceGenreIds: ["g1"],
      candidateGenreIds: ["g1", "g2"],
    };
    expect(computeGenreScore(input)).toBe(0.5);
  });

  it("handles duplicate genre IDs in input gracefully", () => {
    // Duplicates should be treated as a set
    const input: GenreScoreInput = {
      sourceGenreIds: ["g1", "g1", "g2"],
      candidateGenreIds: ["g1", "g2", "g2"],
    };
    expect(computeGenreScore(input)).toBe(1);
  });
});
