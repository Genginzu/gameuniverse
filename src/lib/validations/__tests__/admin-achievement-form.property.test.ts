import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { adminAchievementFormSchema } from "@/lib/validations/admin-achievement-form";

/**
 * Feature: admin-achievements-management, Property 4: Zod schema rejects invalid achievement data
 *
 * _For any_ achievement form data where at least one required field is missing, or
 * where `threshold`/`xpValue` is not a positive integer, or where `key` does not
 * match the `^[a-z][a-z0-9_]*$` pattern, the Zod validation schema should reject it.
 *
 * **Validates: Requirements 2.2, 2.4, 3.2, 5.3, 5.4**
 */

// --- Valid generators ---

const CATEGORIES = ["library", "playtime", "reviews", "social", "collections"] as const;
const TIERS = ["bronze", "silver", "gold"] as const;

const validKeyGenerator = fc.stringMatching(/^[a-z][a-z0-9_]{0,30}$/);
const validCategoryGenerator = fc.constantFrom(...CATEGORIES);
const validTierGenerator = fc.constantFrom(...TIERS);
const validPositiveIntGenerator = fc.integer({ min: 1, max: 10000 });
const validIconGenerator = fc.stringMatching(/^[a-zA-Z0-9_-]{1,50}$/);
const validNameGenerator = fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.length >= 1);
const validDescriptionGenerator = fc
  .string({ minLength: 1, maxLength: 500 })
  .filter((s) => s.length >= 1);
const validSortOrderGenerator = fc.integer({ min: 0, max: 1000 });

/** Generates a fully valid achievement form object */
const validAchievementGenerator = fc.record({
  key: validKeyGenerator,
  category: validCategoryGenerator,
  tier: validTierGenerator,
  threshold: validPositiveIntGenerator,
  xpValue: validPositiveIntGenerator,
  icon: validIconGenerator,
  nameFr: validNameGenerator,
  nameEn: validNameGenerator,
  descriptionFr: validDescriptionGenerator,
  descriptionEn: validDescriptionGenerator,
  sortOrder: validSortOrderGenerator,
});

// --- Invalid generators ---

/** Keys starting with a digit */
const keyStartsWithDigitGenerator = fc.stringMatching(/^[0-9][a-z0-9_]{0,20}$/);

/** Keys with uppercase letters */
const keyWithUppercaseGenerator = fc
  .tuple(
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")),
    fc.stringMatching(/^[a-z0-9_]{0,10}$/),
    fc.constantFrom(..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")),
    fc.stringMatching(/^[a-z0-9_]{0,10}$/)
  )
  .map(([first, mid, upper, rest]) => `${first}${mid}${upper}${rest}`);

/** Keys with special characters (dash, space, dot, etc.) */
const keyWithSpecialCharsGenerator = fc
  .tuple(
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")),
    fc.constantFrom("-", ".", " ", "!", "@", "#", "$", "%")
  )
  .map(([first, special]) => `${first}${special}test`);

/** Non-positive integers: 0, negative, or floats */
const nonPositiveIntGenerator = fc.oneof(
  fc.constant(0),
  fc.integer({ min: -10000, max: -1 }),
  fc
    .double({ min: 0.1, max: 9999.9, noNaN: true, noDefaultInfinity: true })
    .filter((n) => !Number.isInteger(n))
);

// --- Required field names for removal tests ---
const REQUIRED_FIELDS = [
  "key",
  "category",
  "tier",
  "threshold",
  "xpValue",
  "icon",
  "nameFr",
  "nameEn",
  "descriptionFr",
  "descriptionEn",
  "sortOrder",
] as const;

// --- Tests ---

describe("Admin Achievement Form Validation - Property-Based Tests", () => {
  describe("Property 4: Zod schema rejects invalid achievement data", () => {
    describe("Valid data acceptance", () => {
      it("accepts all valid achievement form data", () => {
        fc.assert(
          fc.property(validAchievementGenerator, (data) => {
            const result = adminAchievementFormSchema.safeParse(data);
            expect(result.success).toBe(true);
          }),
          { numRuns: 100 }
        );
      });
    });

    describe("Invalid key rejection", () => {
      it("rejects keys starting with a digit", () => {
        fc.assert(
          fc.property(
            validAchievementGenerator,
            keyStartsWithDigitGenerator,
            (data, invalidKey) => {
              const result = adminAchievementFormSchema.safeParse({ ...data, key: invalidKey });
              expect(result.success).toBe(false);
            }
          ),
          { numRuns: 100 }
        );
      });

      it("rejects keys containing uppercase letters", () => {
        fc.assert(
          fc.property(validAchievementGenerator, keyWithUppercaseGenerator, (data, invalidKey) => {
            const result = adminAchievementFormSchema.safeParse({ ...data, key: invalidKey });
            expect(result.success).toBe(false);
          }),
          { numRuns: 100 }
        );
      });

      it("rejects keys with special characters", () => {
        fc.assert(
          fc.property(
            validAchievementGenerator,
            keyWithSpecialCharsGenerator,
            (data, invalidKey) => {
              const result = adminAchievementFormSchema.safeParse({ ...data, key: invalidKey });
              expect(result.success).toBe(false);
            }
          ),
          { numRuns: 100 }
        );
      });

      it("rejects empty keys", () => {
        fc.assert(
          fc.property(validAchievementGenerator, (data) => {
            const result = adminAchievementFormSchema.safeParse({ ...data, key: "" });
            expect(result.success).toBe(false);
          }),
          { numRuns: 100 }
        );
      });
    });

    describe("Missing required fields rejection", () => {
      it("rejects data with any single required field removed", () => {
        fc.assert(
          fc.property(
            validAchievementGenerator,
            fc.constantFrom(...REQUIRED_FIELDS),
            (data, fieldToRemove) => {
              const incomplete = { ...data };
              delete (incomplete as Record<string, unknown>)[fieldToRemove];
              const result = adminAchievementFormSchema.safeParse(incomplete);
              expect(result.success).toBe(false);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe("Non-positive integer rejection for threshold/xpValue", () => {
      it("rejects non-positive threshold values", () => {
        fc.assert(
          fc.property(validAchievementGenerator, nonPositiveIntGenerator, (data, badValue) => {
            const result = adminAchievementFormSchema.safeParse({ ...data, threshold: badValue });
            expect(result.success).toBe(false);
          }),
          { numRuns: 100 }
        );
      });

      it("rejects non-positive xpValue values", () => {
        fc.assert(
          fc.property(validAchievementGenerator, nonPositiveIntGenerator, (data, badValue) => {
            const result = adminAchievementFormSchema.safeParse({ ...data, xpValue: badValue });
            expect(result.success).toBe(false);
          }),
          { numRuns: 100 }
        );
      });
    });
  });
});

/**
 * Feature: admin-achievements-management, Property 10: i18n keys exist in both locales
 *
 * _For any_ translation key used by the achievements admin components, both
 * `fr.json` and `en.json` should contain a non-empty value for that key.
 *
 * **Validates: Requirements 7.1, 7.2, 7.3, 8.15**
 */

import frMessages from "@/messages/fr.json";
import enMessages from "@/messages/en.json";

/** Recursively flatten a nested object into dot-separated keys */
function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

/** Resolve a dot-separated key path to its value in a nested object */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

describe("Admin Achievement i18n - Property-Based Tests", () => {
  const frNamespace = frMessages.adminAchievements as Record<string, unknown>;
  const enNamespace = enMessages.adminAchievements as Record<string, unknown>;

  const frKeys = flattenKeys(frNamespace);
  const enKeys = flattenKeys(enNamespace);
  const allKeys = [...new Set([...frKeys, ...enKeys])];

  describe("Property 10: i18n keys exist in both locales", () => {
    it("fr.json adminAchievements namespace has keys", () => {
      expect(frKeys.length).toBeGreaterThan(0);
    });

    it("en.json adminAchievements namespace has keys", () => {
      expect(enKeys.length).toBeGreaterThan(0);
    });

    it("for any key in adminAchievements, both locales contain a non-empty value", () => {
      fc.assert(
        fc.property(fc.constantFrom(...allKeys), (key) => {
          const frValue = getNestedValue(frNamespace, key);
          const enValue = getNestedValue(enNamespace, key);

          // Key must exist in both locales
          expect(frValue).toBeDefined();
          expect(enValue).toBeDefined();

          // Values must be non-empty strings
          expect(typeof frValue).toBe("string");
          expect(typeof enValue).toBe("string");
          expect((frValue as string).length).toBeGreaterThan(0);
          expect((enValue as string).length).toBeGreaterThan(0);
        }),
        { numRuns: Math.max(100, allKeys.length * 2) }
      );
    });

    it("fr.json and en.json have the same set of keys in adminAchievements", () => {
      const frKeySet = new Set(frKeys);
      const enKeySet = new Set(enKeys);

      const missingInEn = frKeys.filter((k) => !enKeySet.has(k));
      const missingInFr = enKeys.filter((k) => !frKeySet.has(k));

      expect(missingInEn).toEqual([]);
      expect(missingInFr).toEqual([]);
    });
  });
});
