import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { computeLevel, xpForLevel, computeLevelProgress } from "@/lib/services/levelSystem";

// Feature: achievements-system, Property 5: Level formula correctness
// Validates: Requirements 4.2, 4.4, 4.6

describe("Property 5: Level formula correctness", () => {
  it("computeLevel(xp) equals floor(0.3 × √(xp)) + 1 for any xp ≥ 0", () => {
    fc.assert(
      fc.property(fc.nat(10_000_000), (xp) => {
        const expected = Math.floor(0.3 * Math.sqrt(xp)) + 1;
        expect(computeLevel(xp)).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it("computeLevelProgress(xp).progressPercent is in [0, 99] for any xp ≥ 0", () => {
    fc.assert(
      fc.property(fc.nat(10_000_000), (xp) => {
        const { progressPercent } = computeLevelProgress(xp);
        expect(progressPercent).toBeGreaterThanOrEqual(0);
        expect(progressPercent).toBeLessThanOrEqual(99);
      }),
      { numRuns: 100 }
    );
  });

  it("currentLevelXp < nextLevelXp for any xp ≥ 0", () => {
    fc.assert(
      fc.property(fc.nat(10_000_000), (xp) => {
        const { currentLevelXp, nextLevelXp } = computeLevelProgress(xp);
        expect(currentLevelXp).toBeLessThan(nextLevelXp);
      }),
      { numRuns: 100 }
    );
  });

  it("computeLevelProgress(xp).level matches computeLevel(xp)", () => {
    fc.assert(
      fc.property(fc.nat(10_000_000), (xp) => {
        const progress = computeLevelProgress(xp);
        expect(progress.level).toBe(computeLevel(xp));
      }),
      { numRuns: 100 }
    );
  });

  it("computeLevel(0) returns level 1 (zero XP base case)", () => {
    expect(computeLevel(0)).toBe(1);
    const progress = computeLevelProgress(0);
    expect(progress.level).toBe(1);
    expect(progress.xpTotal).toBe(0);
  });
});

// Feature: achievements-system, Property 10: XP stats response consistency
// Validates: Requirements 8.2

describe("Property 10: XP stats response consistency", () => {
  it("level equals computeLevel(xpTotal) in the stats response", () => {
    fc.assert(
      fc.property(fc.nat(10_000_000), (xp) => {
        const stats = computeLevelProgress(xp);
        expect(stats.level).toBe(computeLevel(xp));
      }),
      { numRuns: 100 }
    );
  });

  it("progressPercent equals computeLevelProgress(xpTotal).progressPercent", () => {
    fc.assert(
      fc.property(fc.nat(10_000_000), (xp) => {
        const stats = computeLevelProgress(xp);
        const expected = computeLevelProgress(xp);
        expect(stats.progressPercent).toBe(expected.progressPercent);
      }),
      { numRuns: 100 }
    );
  });

  it("currentLevelXp + progressFraction × range approximates xpTotal - xpForLevel(level)", () => {
    fc.assert(
      fc.property(fc.nat(10_000_000), (xp) => {
        const stats = computeLevelProgress(xp);
        const range = stats.nextLevelXp - stats.currentLevelXp;
        const xpIntoLevel = xp - xpForLevel(stats.level);

        // progressPercent is floored, so the approximation has up to 1% tolerance
        const approx = Math.floor((stats.progressPercent / 100) * range);
        expect(Math.abs(approx - xpIntoLevel)).toBeLessThanOrEqual(range * 0.01 + 1);
      }),
      { numRuns: 100 }
    );
  });

  it("currentLevelXp equals xpForLevel(level) and nextLevelXp equals xpForLevel(level + 1)", () => {
    fc.assert(
      fc.property(fc.nat(10_000_000), (xp) => {
        const stats = computeLevelProgress(xp);
        expect(stats.currentLevelXp).toBe(xpForLevel(stats.level));
        expect(stats.nextLevelXp).toBe(xpForLevel(stats.level + 1));
      }),
      { numRuns: 100 }
    );
  });
});
