import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { groupByCategory, filterByCategory } from "@/lib/utils/achievementGrouping";
import type {
  AchievementCategory,
  AchievementTier,
  PlayerAchievementWithDetails,
} from "@/types/achievement";

// --- Arbitraries ---

const CATEGORIES: AchievementCategory[] = [
  "library",
  "playtime",
  "reviews",
  "social",
  "collections",
];

const categoryArb: fc.Arbitrary<AchievementCategory> = fc.constantFrom(...CATEGORIES);

const tierArb: fc.Arbitrary<AchievementTier> = fc.constantFrom("bronze", "silver", "gold");

const achievementArb: fc.Arbitrary<PlayerAchievementWithDetails> = fc.record({
  key: fc.string({ minLength: 1, maxLength: 30 }),
  category: categoryArb,
  tier: tierArb,
  threshold: fc.nat({ max: 10000 }),
  xpValue: fc.nat({ max: 1000 }),
  icon: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 1, maxLength: 100 }),
  unlockedAt: fc.oneof(
    fc.constant(null),
    fc.date().map((d) => d.toISOString())
  ),
  sortOrder: fc.nat({ max: 100 }),
});

const achievementsArb = fc.array(achievementArb, { maxLength: 200 });

// --- Property 8: Category grouping preserves all achievements ---

/**
 * Feature: achievements-system, Property 8: Category grouping preserves all achievements
 * **Validates: Requirements 6.4**
 */
describe("Property 8: Category grouping preserves all achievements", () => {
  // Feature: achievements-system, Property 8: Category grouping preserves all achievements
  it("sum of all group sizes equals total number of achievements", () => {
    fc.assert(
      fc.property(achievementsArb, (achievements) => {
        const groups = groupByCategory(achievements);
        const totalInGroups = CATEGORIES.reduce((sum, cat) => sum + groups[cat].length, 0);
        expect(totalInGroups).toBe(achievements.length);
      }),
      { numRuns: 100 }
    );
  });

  it("every achievement in a group has the matching category", () => {
    fc.assert(
      fc.property(achievementsArb, (achievements) => {
        const groups = groupByCategory(achievements);
        for (const cat of CATEGORIES) {
          for (const a of groups[cat]) {
            expect(a.category).toBe(cat);
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});

// --- Property 9: Category filtering correctness ---

/**
 * Feature: achievements-system, Property 9: Category filtering correctness
 * **Validates: Requirements 6.7**
 */
describe("Property 9: Category filtering correctness", () => {
  // Feature: achievements-system, Property 9: Category filtering correctness
  it("all filtered results have the selected category", () => {
    fc.assert(
      fc.property(achievementsArb, categoryArb, (achievements, category) => {
        const filtered = filterByCategory(achievements, category);
        for (const a of filtered) {
          expect(a.category).toBe(category);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("filtering returns all achievements of that category (no loss)", () => {
    fc.assert(
      fc.property(achievementsArb, categoryArb, (achievements, category) => {
        const filtered = filterByCategory(achievements, category);
        const expected = achievements.filter((a) => a.category === category);
        expect(filtered.length).toBe(expected.length);
      }),
      { numRuns: 100 }
    );
  });

  it("filtering with null returns all achievements", () => {
    fc.assert(
      fc.property(achievementsArb, (achievements) => {
        const filtered = filterByCategory(achievements, null);
        expect(filtered.length).toBe(achievements.length);
      }),
      { numRuns: 100 }
    );
  });
});
