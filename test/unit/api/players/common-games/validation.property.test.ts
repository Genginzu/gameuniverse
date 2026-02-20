import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { PlayerService } from "@/lib/services/playerService";

// --- Generators ---

/**
 * Generates strings that are guaranteed NOT to be valid UUIDs.
 * Strategies: empty strings, short strings, strings missing hyphens,
 * strings with invalid hex chars, wrong segment lengths, etc.
 */
const nonUuidStringArb = fc.oneof(
  // Empty or very short strings
  fc.string({ minLength: 0, maxLength: 5 }),
  // Alphanumeric strings without hyphens (wrong format)
  fc.stringMatching(/^[a-zA-Z0-9]{1,40}$/),
  // Strings with special characters
  fc.stringMatching(/^[!@#$%^&*()_+=]{1,20}$/),
  // Almost-UUID but with invalid characters (g-z in hex positions)
  fc.tuple(fc.uuid(), fc.integer({ min: 0, max: 35 })).map(([uuid, pos]) => {
    const chars = uuid.split("");
    // Replace a hex char with an invalid one (g-z)
    const invalidChar = String.fromCharCode(103 + (pos % 20)); // g through z
    const hexPositions = [
      0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 17, 19, 20, 21, 22, 24, 25, 26, 27, 28, 29,
      30, 31, 32, 33, 34, 35,
    ];
    const targetPos = hexPositions[pos % hexPositions.length];
    chars[targetPos] = invalidChar;
    return chars.join("");
  }),
  // UUID missing one hyphen segment
  fc.uuid().map((uuid) => uuid.replace("-", "")),
  // Prefix/suffix noise around a valid UUID
  fc
    .tuple(fc.uuid(), fc.string({ minLength: 1, maxLength: 5 }))
    .map(([uuid, noise]) => noise + uuid),
  fc
    .tuple(fc.uuid(), fc.string({ minLength: 1, maxLength: 5 }))
    .map(([uuid, noise]) => uuid + noise)
);

describe("UUID Validation — Property-Based Tests", () => {
  // Feature: library-comparison, Property 6: Validation UUID
  // **Validates: Requirements 4.3**
  describe("Property 6: Validation UUID", () => {
    it("any valid UUID string is accepted by validatePlayerId", () => {
      fc.assert(
        fc.property(fc.uuid(), (uuid) => {
          expect(PlayerService.validatePlayerId(uuid)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("any non-UUID string is rejected by validatePlayerId", () => {
      fc.assert(
        fc.property(nonUuidStringArb, (str) => {
          expect(PlayerService.validatePlayerId(str)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });
});
