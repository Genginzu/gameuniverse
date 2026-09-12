import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  adminSpeciesFormSchema,
  speciesTranslationSchema,
} from "@/lib/validations/admin-species-form";

/**
 * Feature: character-genders-species, Property 1: Gender/Species CRUD round-trip (validation part)
 * Feature: character-genders-species, Property 3: API validation rejects invalid data (validation part)
 *
 * _For any_ valid species payload containing a slug and translations,
 * the Zod schema should accept it. _For any_ invalid payload, the schema should reject it.
 *
 * **Validates: Requirements 4.3, 4.5, 8.7**
 */

const SLUG_REGEX = /^[a-z]([a-z0-9-]*[a-z0-9])?$/;

function isValidSlug(s: string): boolean {
  return s.length >= 2 && s.length <= 50 && SLUG_REGEX.test(s);
}

// --- Valid generators ---

const validSlugGenerator = fc
  .tuple(
    fc.integer({ min: 2, max: 50 }),
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")),
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789".split(""))
  )
  .chain(([length, firstChar, lastChar]) => {
    if (length === 2) {
      return fc.constant(`${firstChar}${lastChar}`);
    }
    const middleLength = length - 2;
    return fc
      .array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789-".split("")), {
        minLength: middleLength,
        maxLength: middleLength,
      })
      .map((middle) => `${firstChar}${middle.join("")}${lastChar}`);
  })
  .filter((slug) => isValidSlug(slug));

const validLanguageCode = fc.stringMatching(/^[a-z]{2,5}$/);
const validNameGenerator = fc.string({ minLength: 1, maxLength: 255 });

const validTranslationGenerator = fc.record({
  language_code: validLanguageCode,
  name: validNameGenerator,
});

const validSpeciesGenerator = fc.record({
  slug: validSlugGenerator,
  translations: fc.array(validTranslationGenerator, { minLength: 1, maxLength: 5 }),
});

// --- Invalid generators ---

const tooShortSlugGenerator = fc.oneof(
  fc.constant(""),
  fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split(""))
);

const tooLongSlugGenerator = fc
  .tuple(
    fc.integer({ min: 51, max: 80 }),
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split(""))
  )
  .chain(([length, lastChar]) => {
    const middleLength = length - 2;
    return fc
      .array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789-".split("")), {
        minLength: middleLength,
        maxLength: middleLength,
      })
      .map((middle) => `a${middle.join("")}${lastChar}`);
  })
  .filter((slug) => SLUG_REGEX.test(slug));

const digitStartSlugGenerator = fc
  .tuple(fc.constantFrom(..."0123456789".split("")), fc.stringMatching(/^[a-z0-9]{1,10}$/))
  .map(([start, rest]) => `${start}${rest}`)
  .filter((slug) => slug.length >= 2 && slug.length <= 50);

const uppercaseSlugGenerator = fc
  .tuple(
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")),
    fc.stringMatching(/^[a-z0-9]{0,8}$/),
    fc.constantFrom(..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")),
    fc.stringMatching(/^[a-z0-9]{0,8}$/)
  )
  .map(([first, mid1, upper, mid2]) => `${first}${mid1}${upper}${mid2}`)
  .filter((slug) => slug.length >= 2 && slug.length <= 50);

const specialCharsSlugGenerator = fc
  .tuple(
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")),
    fc.stringMatching(/^[a-z0-9]{0,5}$/),
    fc.constantFrom(..." _.!@#".split("")),
    fc.stringMatching(/^[a-z0-9]{1,5}$/)
  )
  .map(([first, mid1, special, mid2]) => `${first}${mid1}${special}${mid2}`)
  .filter((slug) => slug.length >= 2 && slug.length <= 50);

// --- Tests ---

describe("Admin Species Form Schema - Property-Based Tests", () => {
  describe("Property 1: Species CRUD round-trip (validation part)", () => {
    it("accepts all valid species payloads (valid slug + at least one translation)", () => {
      fc.assert(
        fc.property(validSpeciesGenerator, (data) => {
          const result = adminSpeciesFormSchema.safeParse(data);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("accepts valid translations with non-empty language_code and name (1-255 chars)", () => {
      fc.assert(
        fc.property(validTranslationGenerator, (translation) => {
          const result = speciesTranslationSchema.safeParse(translation);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 3: API validation rejects invalid data (validation part)", () => {
    describe("Invalid slug rejection", () => {
      it("rejects empty slug or slug < 2 chars", () => {
        fc.assert(
          fc.property(tooShortSlugGenerator, (slug) => {
            const result = adminSpeciesFormSchema.safeParse({
              slug,
              translations: [{ language_code: "fr", name: "Test" }],
            });
            expect(result.success).toBe(false);
          }),
          { numRuns: 100 }
        );
      });

      it("rejects slug > 50 chars", () => {
        fc.assert(
          fc.property(tooLongSlugGenerator, (slug) => {
            const result = adminSpeciesFormSchema.safeParse({
              slug,
              translations: [{ language_code: "fr", name: "Test" }],
            });
            expect(result.success).toBe(false);
          }),
          { numRuns: 100 }
        );
      });

      it("rejects slug starting with a digit", () => {
        fc.assert(
          fc.property(digitStartSlugGenerator, (slug) => {
            const result = adminSpeciesFormSchema.safeParse({
              slug,
              translations: [{ language_code: "fr", name: "Test" }],
            });
            expect(result.success).toBe(false);
          }),
          { numRuns: 100 }
        );
      });

      it("rejects slug with uppercase letters", () => {
        fc.assert(
          fc.property(uppercaseSlugGenerator, (slug) => {
            const result = adminSpeciesFormSchema.safeParse({
              slug,
              translations: [{ language_code: "fr", name: "Test" }],
            });
            expect(result.success).toBe(false);
          }),
          { numRuns: 100 }
        );
      });

      it("rejects slug with special characters (spaces, dots, underscores)", () => {
        fc.assert(
          fc.property(specialCharsSlugGenerator, (slug) => {
            const result = adminSpeciesFormSchema.safeParse({
              slug,
              translations: [{ language_code: "fr", name: "Test" }],
            });
            expect(result.success).toBe(false);
          }),
          { numRuns: 100 }
        );
      });
    });

    describe("Invalid translations rejection", () => {
      it("rejects empty translations array", () => {
        fc.assert(
          fc.property(validSlugGenerator, (slug) => {
            const result = adminSpeciesFormSchema.safeParse({
              slug,
              translations: [],
            });
            expect(result.success).toBe(false);
          }),
          { numRuns: 100 }
        );
      });

      it("rejects translation with empty name", () => {
        fc.assert(
          fc.property(validSlugGenerator, validLanguageCode, (slug, langCode) => {
            const result = adminSpeciesFormSchema.safeParse({
              slug,
              translations: [{ language_code: langCode, name: "" }],
            });
            expect(result.success).toBe(false);
          }),
          { numRuns: 100 }
        );
      });

      it("rejects translation with empty language_code", () => {
        fc.assert(
          fc.property(validSlugGenerator, validNameGenerator, (slug, name) => {
            const result = adminSpeciesFormSchema.safeParse({
              slug,
              translations: [{ language_code: "", name }],
            });
            expect(result.success).toBe(false);
          }),
          { numRuns: 100 }
        );
      });
    });

    describe("Missing required fields rejection", () => {
      it("rejects payload with missing slug", () => {
        fc.assert(
          fc.property(
            fc.array(validTranslationGenerator, { minLength: 1, maxLength: 3 }),
            (translations) => {
              const result = adminSpeciesFormSchema.safeParse({ translations });
              expect(result.success).toBe(false);
            }
          ),
          { numRuns: 100 }
        );
      });

      it("rejects payload with missing translations", () => {
        fc.assert(
          fc.property(validSlugGenerator, (slug) => {
            const result = adminSpeciesFormSchema.safeParse({ slug });
            expect(result.success).toBe(false);
          }),
          { numRuns: 100 }
        );
      });
    });
  });
});
