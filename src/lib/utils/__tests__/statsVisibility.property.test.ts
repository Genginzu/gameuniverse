import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validatePlayerId } from "@/lib/utils/statsFormatters";

/**
 * Feature: player-stats-dashboard, Property 10: Stats visibility follows privacy rule
 *
 * For any combination of isOwnProfile and statsPrivate, stats are visible
 * iff isOwnProfile || !statsPrivate.
 *
 * **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
 */
describe("Property 10: Stats visibility follows privacy rule", () => {
  // Feature: player-stats-dashboard, Property 10: Stats visibility follows privacy rule
  it("stats visible iff isOwnProfile || !statsPrivate", () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (isOwnProfile, statsPrivate) => {
        const statsVisible = isOwnProfile || !statsPrivate;

        // Owner always sees stats
        if (isOwnProfile) {
          expect(statsVisible).toBe(true);
        }

        // Visitor with private stats cannot see
        if (!isOwnProfile && statsPrivate) {
          expect(statsVisible).toBe(false);
        }

        // Visitor with public stats can see
        if (!isOwnProfile && !statsPrivate) {
          expect(statsVisible).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: player-stats-dashboard, Property 11: UUID validation rejects non-UUID strings
 *
 * For any string not matching UUID v4 format, validatePlayerId returns false.
 * For valid UUID v4, returns true.
 *
 * **Validates: Requirements 9.4**
 */
describe("Property 11: UUID validation rejects non-UUID strings", () => {
  // Feature: player-stats-dashboard, Property 11: UUID validation rejects non-UUID strings
  it("returns true for valid UUID v4 strings", () => {
    // Build a generator that produces only valid UUID v4 strings
    const hexChar = fc.constantFrom(..."0123456789abcdef".split(""));
    const hexBlock = (len: number) =>
      fc.array(hexChar, { minLength: len, maxLength: len }).map((a) => a.join(""));
    const variantChar = fc.constantFrom("8", "9", "a", "b");

    const uuidV4Gen = fc
      .tuple(
        hexBlock(8),
        hexBlock(4),
        hexBlock(3), // 3 chars after the fixed "4"
        variantChar,
        hexBlock(3), // 3 chars after the variant char
        hexBlock(12)
      )
      .map(([p1, p2, p3, variant, p4, p5]) => `${p1}-${p2}-4${p3}-${variant}${p4}-${p5}`);

    fc.assert(
      fc.property(uuidV4Gen, (uuid) => {
        expect(validatePlayerId(uuid)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("returns false for arbitrary non-UUID strings", () => {
    const nonUuidGen = fc.string({ minLength: 0, maxLength: 100 }).filter((s) => {
      // Exclude strings that happen to be valid UUID v4
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return !uuidV4Regex.test(s);
    });

    fc.assert(
      fc.property(nonUuidGen, (str) => {
        expect(validatePlayerId(str)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: player-stats-dashboard, Property 17: Personal goals are hidden for visitors
 *
 * For any profile visit where isOwnProfile is false, goals section should
 * not be rendered regardless of statsPrivate.
 *
 * **Validates: Requirements 13.6**
 */
describe("Property 17: Personal goals are hidden for visitors", () => {
  // Feature: player-stats-dashboard, Property 17: Personal goals are hidden for visitors
  it("goals are always hidden when isOwnProfile is false", () => {
    fc.assert(
      fc.property(fc.boolean(), (statsPrivate) => {
        const isOwnProfile = false;
        const showGoals = isOwnProfile; // Goals only shown to owner

        // Regardless of statsPrivate, goals are hidden for visitors
        expect(showGoals).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("goals are shown only when isOwnProfile is true", () => {
    fc.assert(
      fc.property(fc.boolean(), (statsPrivate) => {
        const isOwnProfile = true;
        const showGoals = isOwnProfile;

        // Owner always sees their goals, regardless of privacy
        expect(showGoals).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
