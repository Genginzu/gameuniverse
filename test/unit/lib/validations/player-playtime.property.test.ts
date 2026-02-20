import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  playerPlaytimeSchema,
  type PlayerPlaytimeInput,
} from "../../../../src/lib/validations/player-playtime";

/**
 * Feature: player-playtime, Property 1: Validation schema (3-field)
 *
 * The schema accepts objects with at least one valid playtime field
 * (playTimeHastily, playTimeNormally, playTimeCompletely).
 * Each field must be strictly positive, at most 50,000, and have at most 1 decimal.
 * Rejects when all fields are null/undefined, or when any provided field is invalid.
 *
 * **Validates: Requirements 6.1, 6.2, 6.3, 2.2**
 */

// --- Generators ---

/** Generates a valid playtime: positive, <= 50000, at most 1 decimal place */
const validPlaytimeGenerator = fc
  .integer({ min: 1, max: 500000 })
  .map((n) => n / 10);

/** Generates null or undefined (optional field) */
const emptyFieldGenerator = fc.oneof(
  fc.constant(null),
  fc.constant(undefined)
);

/** Generates a valid or empty field */
const optionalValidField = fc.oneof(validPlaytimeGenerator, emptyFieldGenerator);

/** Generates negative numbers */
const negativeGenerator = fc
  .integer({ min: 1, max: 500000 })
  .map((n) => -n / 10);

/** Generates numbers > 50000 with at most 1 decimal */
const tooLargeGenerator = fc
  .integer({ min: 500001, max: 1000000 })
  .map((n) => n / 10);

/** Generates numbers with more than 1 decimal place */
const tooManyDecimalsGenerator = fc
  .integer({ min: 1, max: 4999999 })
  .filter((n) => n % 10 !== 0)
  .map((n) => n / 100);

// --- Tests ---

describe("Player Playtime Schema (3-field) - Property-Based Tests", () => {
  it("accepts when at least one field has a valid value", () => {
    fc.assert(
      fc.property(
        optionalValidField,
        optionalValidField,
        validPlaytimeGenerator,
        (hastily, normally, completely) => {
          const result = playerPlaytimeSchema.safeParse({
            playTimeHastily: hastily,
            playTimeNormally: normally,
            playTimeCompletely: completely,
          });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("accepts when all three fields are valid", () => {
    fc.assert(
      fc.property(
        validPlaytimeGenerator,
        validPlaytimeGenerator,
        validPlaytimeGenerator,
        (hastily, normally, completely) => {
          const result = playerPlaytimeSchema.safeParse({
            playTimeHastily: hastily,
            playTimeNormally: normally,
            playTimeCompletely: completely,
          });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("rejects when all fields are null/undefined", () => {
    const result1 = playerPlaytimeSchema.safeParse({
      playTimeHastily: null,
      playTimeNormally: null,
      playTimeCompletely: null,
    });
    expect(result1.success).toBe(false);

    const result2 = playerPlaytimeSchema.safeParse({});
    expect(result2.success).toBe(false);
  });

  it("rejects negative values in any field", () => {
    fc.assert(
      fc.property(negativeGenerator, (hours) => {
        const result = playerPlaytimeSchema.safeParse({
          playTimeHastily: hours,
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects values exceeding 50000 hours in any field", () => {
    fc.assert(
      fc.property(tooLargeGenerator, (hours) => {
        const result = playerPlaytimeSchema.safeParse({
          playTimeNormally: hours,
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects values with more than one decimal place", () => {
    fc.assert(
      fc.property(tooManyDecimalsGenerator, (hours) => {
        const result = playerPlaytimeSchema.safeParse({
          playTimeCompletely: hours,
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("valid data round-trips through parse without data loss", () => {
    fc.assert(
      fc.property(
        validPlaytimeGenerator,
        validPlaytimeGenerator,
        validPlaytimeGenerator,
        (hastily, normally, completely) => {
          const result = playerPlaytimeSchema.safeParse({
            playTimeHastily: hastily,
            playTimeNormally: normally,
            playTimeCompletely: completely,
          });
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.playTimeHastily).toBe(hastily);
            expect(result.data.playTimeNormally).toBe(normally);
            expect(result.data.playTimeCompletely).toBe(completely);
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
