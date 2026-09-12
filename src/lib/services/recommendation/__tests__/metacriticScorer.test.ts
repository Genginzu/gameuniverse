import { describe, it, expect } from "vitest";
import {
  computeMetacriticScore,
  type MetacriticScoreInput,
} from "@/lib/services/recommendation/metacriticScorer";

describe("computeMetacriticScore", () => {
  it("should return null when metascore is null", () => {
    const input: MetacriticScoreInput = { metascore: null };
    expect(computeMetacriticScore(input)).toBeNull();
  });

  it("should return 0 for metascore 0", () => {
    expect(computeMetacriticScore({ metascore: 0 })).toBe(0);
  });

  it("should return 1 for metascore 100", () => {
    expect(computeMetacriticScore({ metascore: 100 })).toBe(1);
  });

  it("should normalize metascore to [0, 1]", () => {
    expect(computeMetacriticScore({ metascore: 75 })).toBeCloseTo(0.75);
    expect(computeMetacriticScore({ metascore: 50 })).toBeCloseTo(0.5);
    expect(computeMetacriticScore({ metascore: 92 })).toBeCloseTo(0.92);
  });

  it("should clamp values above 100 to 1", () => {
    expect(computeMetacriticScore({ metascore: 150 })).toBe(1);
  });

  it("should clamp negative values to 0", () => {
    expect(computeMetacriticScore({ metascore: -10 })).toBe(0);
  });
});
