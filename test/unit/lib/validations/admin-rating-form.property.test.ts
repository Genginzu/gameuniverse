import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { adminRatingFormSchema } from "../../../../src/lib/validations/admin-rating-form";

/**
 * Feature: admin-rating-pages, Property 1: Validation du schéma —
 * données valides acceptées, données invalides rejetées
 *
 * _For any_ rating form data with valid translations (language_code non-empty,
 * description between 1 and 500 characters), the Zod schema must accept it.
 * _For any_ data with an empty language_code or a description exceeding 500
 * characters, the schema must reject it.
 *
 * **Validates: Requirements 2.1**
 */

// --- Generators ---

/** Valid code: 1-10 non-empty string */
const validCodeGenerator = fc
  .string({ minLength: 1, maxLength: 10 })
  .filter((s) => s.trim().length > 0);

/** Valid display_name: 1-50 non-empty string */
const validDisplayNameGenerator = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0);

/** Valid minimum_age: non-negative integer */
const validMinimumAgeGenerator = fc.integer({ min: 0, max: 100 });

/** Valid color_hex: #RRGGBB or empty */
const validColorHexGenerator = fc.oneof(
  fc.constant(""),
  fc
    .array(fc.constantFrom(..."0123456789ABCDEFabcdef".split("")), {
      minLength: 6,
      maxLength: 6,
    })
    .map((chars) => `#${chars.join("")}`)
);

/** Valid icon_url: valid URL or empty */
const validIconUrlGenerator = fc.oneof(fc.constant(""), fc.webUrl());

/** Valid sort_order: non-negative integer */
const validSortOrderGenerator = fc.integer({ min: 0, max: 1000 });

/** Valid translation: non-empty language_code, description 1-500 chars */
const validTranslationGenerator = fc.record({
  language_code: fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.trim().length > 0),
  description: fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length > 0),
});

/** Valid translations array (0 to 5 translations) */
const validTranslationsGenerator = fc.array(validTranslationGenerator, {
  minLength: 0,
  maxLength: 5,
});

/** Complete valid form data */
const validFormDataGenerator = fc
  .tuple(
    validCodeGenerator,
    validDisplayNameGenerator,
    validMinimumAgeGenerator,
    validColorHexGenerator,
    validIconUrlGenerator,
    validSortOrderGenerator,
    validTranslationsGenerator
  )
  .map(([code, display_name, minimum_age, color_hex, icon_url, sort_order, translations]) => ({
    code,
    display_name,
    minimum_age,
    color_hex,
    icon_url,
    sort_order,
    translations,
  }));

// --- Invalid translation generators ---

/** Translation with empty language_code */
const emptyLanguageCodeTranslationGenerator = fc.record({
  language_code: fc.constant(""),
  description: fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length > 0),
});

/** Translation with description exceeding 500 characters */
const tooLongDescriptionTranslationGenerator = fc.record({
  language_code: fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.trim().length > 0),
  description: fc.string({ minLength: 501, maxLength: 600 }),
});

/** Translation with empty description */
const emptyDescriptionTranslationGenerator = fc.record({
  language_code: fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.trim().length > 0),
  description: fc.constant(""),
});

// --- Tests ---

describe("Admin Rating Form Schema - Property-Based Tests", () => {
  describe("Property 1: Validation du schéma — données valides acceptées, données invalides rejetées", () => {
    it("accepts all valid rating form data with valid translations", () => {
      fc.assert(
        fc.property(validFormDataGenerator, (data) => {
          const result = adminRatingFormSchema.safeParse(data);
          expect(result.success).toBe(true);
        }),
        { numRuns: 30 }
      );
    });

    it("accepts form data with empty translations array", () => {
      fc.assert(
        fc.property(
          validCodeGenerator,
          validDisplayNameGenerator,
          validMinimumAgeGenerator,
          (code, display_name, minimum_age) => {
            const result = adminRatingFormSchema.safeParse({
              code,
              display_name,
              minimum_age,
              translations: [],
            });
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("rejects translations with empty language_code", () => {
      fc.assert(
        fc.property(
          validCodeGenerator,
          validDisplayNameGenerator,
          validMinimumAgeGenerator,
          emptyLanguageCodeTranslationGenerator,
          (code, display_name, minimum_age, badTranslation) => {
            const result = adminRatingFormSchema.safeParse({
              code,
              display_name,
              minimum_age,
              translations: [badTranslation],
            });
            expect(result.success).toBe(false);
            if (!result.success) {
              const translationErrors = result.error.issues.filter((i) =>
                i.path.includes("language_code")
              );
              expect(translationErrors.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("rejects translations with description exceeding 500 characters", () => {
      fc.assert(
        fc.property(
          validCodeGenerator,
          validDisplayNameGenerator,
          validMinimumAgeGenerator,
          tooLongDescriptionTranslationGenerator,
          (code, display_name, minimum_age, badTranslation) => {
            const result = adminRatingFormSchema.safeParse({
              code,
              display_name,
              minimum_age,
              translations: [badTranslation],
            });
            expect(result.success).toBe(false);
            if (!result.success) {
              const descErrors = result.error.issues.filter(
                (i) => i.path.includes("description") && i.path.includes("translations")
              );
              expect(descErrors.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("rejects translations with empty description", () => {
      fc.assert(
        fc.property(
          validCodeGenerator,
          validDisplayNameGenerator,
          validMinimumAgeGenerator,
          emptyDescriptionTranslationGenerator,
          (code, display_name, minimum_age, badTranslation) => {
            const result = adminRatingFormSchema.safeParse({
              code,
              display_name,
              minimum_age,
              translations: [badTranslation],
            });
            expect(result.success).toBe(false);
            if (!result.success) {
              const descErrors = result.error.issues.filter(
                (i) => i.path.includes("description") && i.path.includes("translations")
              );
              expect(descErrors.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("valid data round-trips through parse without data loss on translations", () => {
      fc.assert(
        fc.property(validFormDataGenerator, (data) => {
          const result = adminRatingFormSchema.safeParse(data);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.translations.length).toBe(data.translations.length);
            for (let i = 0; i < data.translations.length; i++) {
              expect(result.data.translations[i].language_code).toBe(
                data.translations[i].language_code
              );
              expect(result.data.translations[i].description).toBe(
                data.translations[i].description
              );
            }
          }
        }),
        { numRuns: 30 }
      );
    });
  });
});
