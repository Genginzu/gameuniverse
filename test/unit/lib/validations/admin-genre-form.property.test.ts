import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import {
  adminGenreFormSchema,
  genreTranslationSchema,
} from "../../../../src/lib/validations/admin-genre-form";

/**
 * Feature: admin-genre-management, Property 5: Validation du slug
 *
 * _Pour toute_ chaîne de caractères, le schéma de validation du slug accepte
 * la chaîne si et seulement si elle contient uniquement des lettres minuscules,
 * des chiffres et des tirets, commence par une lettre, se termine par une
 * lettre ou un chiffre, et a entre 2 et 50 caractères.
 *
 * **Validates: Requirements 2.4**
 */

const SLUG_REGEX = /^[a-z]([a-z0-9-]*[a-z0-9])?$/;

/** Helper: checks if a slug is valid according to the spec */
function isValidSlug(s: string): boolean {
  return s.length >= 2 && s.length <= 50 && SLUG_REGEX.test(s);
}

/** Minimal valid translation to isolate slug validation */
const validTranslation = [{ language_code: "en", name: "Test", description: "" }];

// --- Valid slug generators ---

/** Generates a valid slug: starts with [a-z], ends with [a-z0-9], middle can have [a-z0-9-], 2-50 chars */
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

// --- Invalid slug generators ---

/** Slug too short (0-1 chars) */
const tooShortSlugGenerator = fc.oneof(
  fc.constant(""),
  fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split(""))
);

/** Slug too long (51+ chars) */
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

/** Slug starting with a digit or hyphen */
const invalidStartSlugGenerator = fc
  .tuple(fc.constantFrom(..."0123456789-".split("")), fc.stringMatching(/^[a-z0-9]{1,10}$/))
  .map(([start, rest]) => `${start}${rest}`)
  .filter((slug) => slug.length >= 2 && slug.length <= 50 && !isValidSlug(slug));

/** Slug ending with a hyphen */
const hyphenEndSlugGenerator = fc
  .tuple(
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")),
    fc.array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789-".split("")), {
      minLength: 0,
      maxLength: 10,
    })
  )
  .map(([first, middle]) => `${first}${middle.join("")}-`)
  .filter((slug) => slug.length >= 2 && slug.length <= 50);

/** Slug with uppercase letters */
const uppercaseSlugGenerator = fc
  .tuple(
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")),
    fc.stringMatching(/^[a-z0-9]{0,8}$/),
    fc.constantFrom(..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")),
    fc.stringMatching(/^[a-z0-9]{0,8}$/)
  )
  .map(([first, mid1, upper, mid2]) => `${first}${mid1}${upper}${mid2}`)
  .filter((slug) => slug.length >= 2 && slug.length <= 50);

/** Slug with special characters (spaces, underscores, dots, etc.) */
const specialCharsSlugGenerator = fc
  .tuple(
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")),
    fc.stringMatching(/^[a-z0-9]{0,5}$/),
    fc.constantFrom(..." _.!@#$%^&*()+=".split("")),
    fc.stringMatching(/^[a-z0-9]{1,5}$/)
  )
  .map(([first, mid1, special, mid2]) => `${first}${mid1}${special}${mid2}`)
  .filter((slug) => slug.length >= 2 && slug.length <= 50);

// --- Tests ---

describe("Admin Genre Form Schema - Property-Based Tests", () => {
  describe("Property 5: Validation du slug", () => {
    // Feature: admin-genre-management, Property 5: Validation du slug

    it("accepts all valid slugs (lowercase letters, digits, hyphens, starts with letter, ends with letter/digit, 2-50 chars)", () => {
      fc.assert(
        fc.property(validSlugGenerator, (slug) => {
          const result = adminGenreFormSchema.safeParse({
            slug,
            translations: validTranslation,
          });
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.slug).toBe(slug);
          }
        }),
        { numRuns: 200 }
      );
    });

    it("rejects slugs that are too short (< 2 chars)", () => {
      fc.assert(
        fc.property(tooShortSlugGenerator, (slug) => {
          const result = adminGenreFormSchema.safeParse({
            slug,
            translations: validTranslation,
          });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects slugs that are too long (> 50 chars)", () => {
      fc.assert(
        fc.property(tooLongSlugGenerator, (slug) => {
          const result = adminGenreFormSchema.safeParse({
            slug,
            translations: validTranslation,
          });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects slugs starting with a digit or hyphen", () => {
      fc.assert(
        fc.property(invalidStartSlugGenerator, (slug) => {
          const result = adminGenreFormSchema.safeParse({
            slug,
            translations: validTranslation,
          });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects slugs ending with a hyphen", () => {
      fc.assert(
        fc.property(hyphenEndSlugGenerator, (slug) => {
          const result = adminGenreFormSchema.safeParse({
            slug,
            translations: validTranslation,
          });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects slugs with uppercase letters", () => {
      fc.assert(
        fc.property(uppercaseSlugGenerator, (slug) => {
          const result = adminGenreFormSchema.safeParse({
            slug,
            translations: validTranslation,
          });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects slugs with special characters", () => {
      fc.assert(
        fc.property(specialCharsSlugGenerator, (slug) => {
          const result = adminGenreFormSchema.safeParse({
            slug,
            translations: validTranslation,
          });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("bijectivity: isValidSlug predicate matches schema acceptance for arbitrary strings", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            validSlugGenerator,
            tooShortSlugGenerator,
            tooLongSlugGenerator,
            invalidStartSlugGenerator,
            hyphenEndSlugGenerator,
            uppercaseSlugGenerator,
            specialCharsSlugGenerator,
            fc.string({ minLength: 0, maxLength: 60 })
          ),
          (slug) => {
            const result = adminGenreFormSchema.safeParse({
              slug,
              translations: validTranslation,
            });
            expect(result.success).toBe(isValidSlug(slug));
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  // Feature: admin-genre-management, Property 6: Validation des traductions
  describe("Property 6: Validation des traductions", () => {
    /**
     * Property 6 : Validation des traductions
     *
     * _Pour toute_ traduction, le schéma de validation accepte la traduction
     * si et seulement si le nom est non vide et ne dépasse pas 100 caractères,
     * et la description ne dépasse pas 500 caractères.
     *
     * **Validates: Requirements 2.5, 2.6**
     */

    /** Helper: checks if a translation is valid according to the spec */
    function isValidTranslation(name: string, description: string): boolean {
      return name.length >= 1 && name.length <= 100 && description.length <= 500;
    }

    /** Generator for valid language codes */
    const validLanguageCode = fc.stringMatching(/^[a-z]{2,5}$/);

    /** Generator for valid names (1-100 chars, non-empty) */
    const validNameGenerator = fc.string({ minLength: 1, maxLength: 100 });

    /** Generator for valid descriptions (0-500 chars) */
    const validDescriptionGenerator = fc.string({ minLength: 0, maxLength: 500 });

    /** Generator for invalid names: empty string */
    const emptyNameGenerator = fc.constant("");

    /** Generator for names that are too long (> 100 chars) */
    const tooLongNameGenerator = fc.string({ minLength: 101, maxLength: 200 });

    /** Generator for descriptions that are too long (> 500 chars) */
    const tooLongDescriptionGenerator = fc.string({ minLength: 501, maxLength: 700 });

    it("accepts translations with valid name (1-100 chars) and valid description (≤ 500 chars)", () => {
      fc.assert(
        fc.property(
          validLanguageCode,
          validNameGenerator,
          validDescriptionGenerator,
          (langCode, name, description) => {
            const result = genreTranslationSchema.safeParse({
              language_code: langCode,
              name,
              description,
            });
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 200 }
      );
    });

    it("rejects translations with empty name", () => {
      fc.assert(
        fc.property(validLanguageCode, validDescriptionGenerator, (langCode, description) => {
          const result = genreTranslationSchema.safeParse({
            language_code: langCode,
            name: "",
            description,
          });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects translations with name exceeding 100 characters", () => {
      fc.assert(
        fc.property(
          validLanguageCode,
          tooLongNameGenerator,
          validDescriptionGenerator,
          (langCode, name, description) => {
            const result = genreTranslationSchema.safeParse({
              language_code: langCode,
              name,
              description,
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects translations with description exceeding 500 characters", () => {
      fc.assert(
        fc.property(
          validLanguageCode,
          validNameGenerator,
          tooLongDescriptionGenerator,
          (langCode, name, description) => {
            const result = genreTranslationSchema.safeParse({
              language_code: langCode,
              name,
              description,
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("accepts translations with undefined description", () => {
      fc.assert(
        fc.property(validLanguageCode, validNameGenerator, (langCode, name) => {
          const result = genreTranslationSchema.safeParse({
            language_code: langCode,
            name,
          });
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("bijectivity: isValidTranslation predicate matches schema acceptance for arbitrary inputs", () => {
      fc.assert(
        fc.property(
          validLanguageCode,
          fc.oneof(validNameGenerator, emptyNameGenerator, tooLongNameGenerator),
          fc.oneof(validDescriptionGenerator, tooLongDescriptionGenerator),
          (langCode, name, description) => {
            const result = genreTranslationSchema.safeParse({
              language_code: langCode,
              name,
              description,
            });
            expect(result.success).toBe(isValidTranslation(name, description));
          }
        ),
        { numRuns: 200 }
      );
    });
  });
});
