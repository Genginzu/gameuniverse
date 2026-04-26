import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { computePlaytimeAverage } from "../../../../src/lib/services/player-playtime-utils";

/**
 * Feature: player-playtime, Property 4: Average calculation correctness
 *
 * _For any_ non-empty set of strictly positive playtime values for a game, the
 * returned average SHALL equal the arithmetic mean of those values (within
 * floating-point tolerance), and the count SHALL equal the number of values in
 * the set.
 *
 * **Validates: Requirements 4.1**
 */

// --- Generators ---

/** Generates a strictly positive playtime value with at most 1 decimal */
const positivePlaytime = fc.integer({ min: 1, max: 500000 }).map((n) => n / 10);

/** Generates a non-empty array of positive playtime values */
const positivePlaytimeArray = fc.array(positivePlaytime, {
  minLength: 1,
  maxLength: 200,
});

/** Generates an array that may include zeros and negatives mixed with positives */
const mixedPlaytimeArray = fc.array(
  fc.oneof(
    positivePlaytime,
    fc.constant(0),
    fc.integer({ min: -10000, max: -1 }).map((n) => n / 10)
  ),
  { minLength: 1, maxLength: 100 }
);

// --- Tests ---

describe("Player Playtime Average - Property-Based Tests", () => {
  describe("Property 4: Average calculation correctness", () => {
    it("returns correct arithmetic mean and count for positive values", () => {
      fc.assert(
        fc.property(positivePlaytimeArray, (values) => {
          const { average, count } = computePlaytimeAverage(values);

          expect(count).toBe(values.length);
          expect(average).not.toBeNull();

          const expectedAvg = values.reduce((a, b) => a + b, 0) / values.length;
          expect(Math.abs(average! - expectedAvg)).toBeLessThan(1e-9);
        }),
        { numRuns: 200 }
      );
    });

    it("returns null average and zero count for empty array", () => {
      const { average, count } = computePlaytimeAverage([]);
      expect(average).toBeNull();
      expect(count).toBe(0);
    });

    it("filters out non-positive values before computing", () => {
      fc.assert(
        fc.property(mixedPlaytimeArray, (values) => {
          const { average, count } = computePlaytimeAverage(values);
          const positiveOnly = values.filter((v) => v > 0);

          expect(count).toBe(positiveOnly.length);

          if (positiveOnly.length === 0) {
            expect(average).toBeNull();
          } else {
            const expectedAvg = positiveOnly.reduce((a, b) => a + b, 0) / positiveOnly.length;
            expect(Math.abs(average! - expectedAvg)).toBeLessThan(1e-9);
          }
        }),
        { numRuns: 200 }
      );
    });

    it("single value returns that value as average with count 1", () => {
      fc.assert(
        fc.property(positivePlaytime, (value) => {
          const { average, count } = computePlaytimeAverage([value]);
          expect(count).toBe(1);
          expect(average).toBe(value);
        }),
        { numRuns: 100 }
      );
    });
  });
});
