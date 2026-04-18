import { describe, it, expect } from "vitest";
import { computeOwnershipOverlap } from "@/lib/services/recommendation/ownershipOverlap";

const set = (...ids: string[]) => new Set(ids);

describe("computeOwnershipOverlap", () => {
  it("returns zeros when both libraries are empty", () => {
    expect(computeOwnershipOverlap({ aGames: set(), bGames: set() })).toEqual({
      jaccard: 0,
      intersection: 0,
      union: 0,
    });
  });

  it("is 0 when one library is empty", () => {
    const res = computeOwnershipOverlap({ aGames: set("g1", "g2"), bGames: set() });
    expect(res).toEqual({ jaccard: 0, intersection: 0, union: 2 });
  });

  it("is 1 when libraries are identical", () => {
    const res = computeOwnershipOverlap({
      aGames: set("g1", "g2", "g3"),
      bGames: set("g1", "g2", "g3"),
    });
    expect(res).toEqual({ jaccard: 1, intersection: 3, union: 3 });
  });

  it("computes partial overlap (2 shared out of 5 union)", () => {
    const res = computeOwnershipOverlap({
      aGames: set("g1", "g2", "g3"),
      bGames: set("g2", "g3", "g4", "g5"),
    });
    expect(res.intersection).toBe(2);
    expect(res.union).toBe(5);
    expect(res.jaccard).toBeCloseTo(2 / 5);
  });

  it("is symmetric", () => {
    const a = set("g1", "g2");
    const b = set("g2", "g3", "g4");
    const ab = computeOwnershipOverlap({ aGames: a, bGames: b });
    const ba = computeOwnershipOverlap({ aGames: b, bGames: a });
    expect(ab).toEqual(ba);
  });
});
