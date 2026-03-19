import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { computePlatformDistribution } from "@/lib/services/dashboardStatsCompute";

// --- Generators ---

const platformNameGen = fc.stringMatching(/^[A-Za-z0-9 ]{2,20}$/);

/**
 * Feature: game-platforms, Property 6: Platform distribution computation
 *
 * For any non-empty player library with games having platform associations,
 * computePlatformDistribution must return entries where the sum of all count
 * values equals the total number of game-platform assignments in the library,
 * and all percentage values sum to approximately 100% (within rounding tolerance).
 * The entries must be sorted by count descending.
 *
 * **Validates: Requirements 5.1, 5.3**
 */
describe("Property 6: Platform distribution computation", () => {
  it("sum of counts equals total game-platform assignments", () => {
    const libraryGen = fc.array(
      fc.record({
        platforms: fc.array(platformNameGen, { minLength: 1, maxLength: 5 }),
      }),
      { minLength: 1, maxLength: 30 }
    );

    fc.assert(
      fc.property(libraryGen, (library) => {
        const result = computePlatformDistribution(library);

        const expectedTotal = library.reduce((sum, e) => sum + e.platforms.length, 0);
        const resultTotal = result.reduce((sum, e) => sum + e.count, 0);

        expect(resultTotal).toBe(expectedTotal);
      }),
      { numRuns: 100 }
    );
  });

  it("percentages sum to approximately 100%", () => {
    const libraryGen = fc.array(
      fc.record({
        platforms: fc.array(platformNameGen, { minLength: 1, maxLength: 5 }),
      }),
      { minLength: 1, maxLength: 30 }
    );

    fc.assert(
      fc.property(libraryGen, (library) => {
        const result = computePlatformDistribution(library);

        if (result.length === 0) return;

        const totalPercentage = result.reduce((sum, e) => sum + e.percentage, 0);
        // Each entry rounds to 1 decimal, so cumulative error can be up to 0.05 * N entries
        const tolerance = result.length * 0.1;
        expect(Math.abs(totalPercentage - 100)).toBeLessThanOrEqual(tolerance);
      }),
      { numRuns: 100 }
    );
  });

  it("entries are sorted by count descending", () => {
    const libraryGen = fc.array(
      fc.record({
        platforms: fc.array(platformNameGen, { minLength: 1, maxLength: 5 }),
      }),
      { minLength: 1, maxLength: 30 }
    );

    fc.assert(
      fc.property(libraryGen, (library) => {
        const result = computePlatformDistribution(library);

        for (let i = 1; i < result.length; i++) {
          expect(result[i - 1].count).toBeGreaterThanOrEqual(result[i].count);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("returns empty array for empty library", () => {
    const result = computePlatformDistribution([]);
    expect(result).toEqual([]);
  });

  it("returns empty array when all games have empty platforms", () => {
    const libraryGen = fc.array(fc.record({ platforms: fc.constant([] as string[]) }), {
      minLength: 1,
      maxLength: 10,
    });

    fc.assert(
      fc.property(libraryGen, (library) => {
        const result = computePlatformDistribution(library);
        expect(result).toEqual([]);
      }),
      { numRuns: 100 }
    );
  });
});
