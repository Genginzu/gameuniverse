import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { adminRatingSystemFormSchema } from "../../../../src/lib/validations/admin-rating-system-form";
import { adminRatingFormSchema } from "../../../../src/lib/validations/admin-rating-form";
import {
  adminDescriptorFormSchema,
  descriptorTranslationSchema,
} from "../../../../src/lib/validations/admin-descriptor-form";

// --- Shared helpers ---

const RATING_SYSTEM_CODE_REGEX = /^[A-Z][A-Z0-9_]*$/;

function isValidRatingSystemCode(code: string): boolean {
  return code.length >= 1 && code.length <= 10 && RATING_SYSTEM_CODE_REGEX.test(code);
}

// --- Generators: Rating System ---

const validRatingSystemCodeGenerator = fc
  .tuple(
    fc.integer({ min: 1, max: 10 }),
    fc.constantFrom(..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""))
  )
  .chain(([length, firstChar]) => {
    if (length === 1) return fc.constant(firstChar);
    const restLength = length - 1;
    return fc
      .array(fc.constantFrom(..."ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_".split("")), {
        minLength: restLength,
        maxLength: restLength,
      })
      .map((rest) => `${firstChar}${rest.join("")}`);
  })
  .filter((code) => isValidRatingSystemCode(code));

const validNameGenerator = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

const validDescriptionGenerator = fc.oneof(
  fc.constant(undefined),
  fc.constant(""),
  fc.string({ minLength: 1, maxLength: 500 })
);

const validCountryCodesGenerator = fc.array(fc.stringMatching(/^[A-Z]{2}$/), {
  minLength: 0,
  maxLength: 5,
});

const validUrlGenerator = fc.oneof(fc.constant(undefined), fc.constant(""), fc.webUrl());

const validRatingSystemFormGenerator = fc
  .tuple(
    validRatingSystemCodeGenerator,
    validNameGenerator,
    validDescriptionGenerator,
    validCountryCodesGenerator,
    validUrlGenerator
  )
  .map(([code, name, description, country_codes, website_url]) => ({
    code,
    name,
    description,
    country_codes,
    website_url,
  }));

// --- Generators: Rating ---

const validRatingCodeGenerator = fc
  .string({ minLength: 1, maxLength: 10 })
  .filter((s) => s.trim().length > 0);

const validDisplayNameGenerator = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0);

const validMinimumAgeGenerator = fc.integer({ min: 0, max: 200 });

const validColorHexGenerator = fc.oneof(
  fc.constant(undefined),
  fc.constant(""),
  fc
    .array(fc.constantFrom(..."0123456789ABCDEFabcdef".split("")), {
      minLength: 6,
      maxLength: 6,
    })
    .map((chars) => `#${chars.join("")}`)
);

const validSortOrderGenerator = fc.integer({ min: 0, max: 1000 });

const validRatingFormGenerator = fc
  .tuple(
    validRatingCodeGenerator,
    validDisplayNameGenerator,
    validMinimumAgeGenerator,
    validColorHexGenerator,
    validUrlGenerator,
    validDescriptionGenerator,
    validSortOrderGenerator
  )
  .map(([code, display_name, minimum_age, color_hex, icon_url, description, sort_order]) => ({
    code,
    display_name,
    minimum_age,
    color_hex,
    icon_url,
    description,
    sort_order,
  }));

// --- Generators: Descriptor ---

const validDescriptorCodeGenerator = fc
  .string({ minLength: 1, maxLength: 30 })
  .filter((s) => s.trim().length > 0);

const validLanguageCodeGenerator = fc.stringMatching(/^[a-z]{2,5}$/);

const validTranslationGenerator = fc
  .tuple(
    validLanguageCodeGenerator,
    fc.string({ minLength: 1, maxLength: 100 }),
    fc.oneof(fc.constant(undefined), fc.constant(""), fc.string({ minLength: 1, maxLength: 500 }))
  )
  .map(([language_code, name, description]) => ({
    language_code,
    name,
    description,
  }));

const validTranslationsArrayGenerator = fc.array(validTranslationGenerator, {
  minLength: 1,
  maxLength: 5,
});

const validDescriptorFormGenerator = fc
  .tuple(validDescriptorCodeGenerator, validUrlGenerator, validTranslationsArrayGenerator)
  .map(([code, icon_url, translations]) => ({
    code,
    icon_url,
    translations,
  }));

// --- Invalid generators ---

/** Generates invalid rating system codes (lowercase, starting with digit/underscore, too long) */
const invalidRatingSystemCodeGenerator = fc.oneof(
  fc.constant(""),
  fc.stringMatching(/^[a-z]{1,10}$/),
  fc.stringMatching(/^[0-9][A-Z]{1,9}$/),
  fc.stringMatching(/^_[A-Z]{1,9}$/),
  fc
    .array(fc.constantFrom(..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")), {
      minLength: 11,
      maxLength: 20,
    })
    .map((chars) => chars.join(""))
);

/** Generates negative ages */
const negativeAgeGenerator = fc.integer({ min: -1000, max: -1 });

/** Generates non-integer ages */
const nonIntegerAgeGenerator = fc
  .double({ min: 0.01, max: 100, noNaN: true })
  .filter((n) => !Number.isInteger(n));

/** Generates invalid hex colors */
const invalidColorHexGenerator = fc.oneof(
  fc.constant("FF0000"),
  fc.constant("#F00"),
  fc.constant("#GGGGGG"),
  fc.constant("red"),
  fc.constant("#12345"),
  fc.constant("#1234567")
);

/** Generates invalid URLs (non-empty, non-URL strings) */
const invalidUrlGenerator = fc.oneof(
  fc.constant("not-a-url"),
  fc.constant("ftp://"),
  fc.constant("just text"),
  fc.constant("://missing-scheme")
);

// --- Tests ---

describe("Admin Age Classifications - Property-Based Tests", () => {
  /**
   * Feature: admin-age-classification, Property 4: Rejet des doublons de code
   *
   * _Pour tout_ type d'entitÃ© (systÃ¨me, note, descripteur), les schÃ©mas
   * acceptent les codes valides et rejettent les codes invalides.
   * La validation de code est le premier rempart contre les doublons :
   * seuls les codes conformes au format attendu sont acceptÃ©s.
   *
   * **Validates: Requirements 3.2, 3.3, 7.2, 7.3, 11.2, 14.1, 14.4**
   */
  describe("Property 4: Rejet des doublons de code", () => {
    // Feature: admin-age-classification, Property 4: Rejet des doublons de code

    describe("Rating System code validation", () => {
      it("accepts all valid rating system codes (^[A-Z][A-Z0-9_]*$, 1-10 chars)", () => {
        fc.assert(
          fc.property(validRatingSystemCodeGenerator, validNameGenerator, (code, name) => {
            const result = adminRatingSystemFormSchema.safeParse({ code, name });
            expect(result.success).toBe(true);
          }),
          { numRuns: 200 }
        );
      });

      it("rejects all invalid rating system codes", () => {
        fc.assert(
          fc.property(invalidRatingSystemCodeGenerator, validNameGenerator, (code, name) => {
            const result = adminRatingSystemFormSchema.safeParse({ code, name });
            expect(result.success).toBe(false);
          }),
          { numRuns: 200 }
        );
      });

      it("bijectivity: isValidRatingSystemCode matches schema acceptance", () => {
        fc.assert(
          fc.property(
            fc.oneof(
              validRatingSystemCodeGenerator,
              invalidRatingSystemCodeGenerator,
              fc.string({ minLength: 0, maxLength: 15 })
            ),
            validNameGenerator,
            (code, name) => {
              const result = adminRatingSystemFormSchema.safeParse({ code, name });
              expect(result.success).toBe(isValidRatingSystemCode(code));
            }
          ),
          { numRuns: 200 }
        );
      });
    });

    describe("Rating code validation", () => {
      it("accepts all valid rating codes (non-empty, 1-10 chars)", () => {
        fc.assert(
          fc.property(validRatingCodeGenerator, (code) => {
            const result = adminRatingFormSchema.safeParse({
              code,
              display_name: "Test",
              minimum_age: 0,
            });
            expect(result.success).toBe(true);
          }),
          { numRuns: 200 }
        );
      });

      it("rejects empty rating codes", () => {
        const result = adminRatingFormSchema.safeParse({
          code: "",
          display_name: "Test",
          minimum_age: 0,
        });
        expect(result.success).toBe(false);
      });

      it("rejects rating codes longer than 10 characters", () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 11, maxLength: 30 }).filter((s) => s.trim().length > 0),
            (code) => {
              const result = adminRatingFormSchema.safeParse({
                code,
                display_name: "Test",
                minimum_age: 0,
              });
              expect(result.success).toBe(false);
            }
          ),
          { numRuns: 30 }
        );
      });
    });

    describe("Descriptor code validation", () => {
      const validTranslation = [{ language_code: "en", name: "Test", description: "" }];

      it("accepts all valid descriptor codes (non-empty, 1-30 chars)", () => {
        fc.assert(
          fc.property(validDescriptorCodeGenerator, (code) => {
            const result = adminDescriptorFormSchema.safeParse({
              code,
              translations: validTranslation,
            });
            expect(result.success).toBe(true);
          }),
          { numRuns: 200 }
        );
      });

      it("rejects empty descriptor codes", () => {
        const result = adminDescriptorFormSchema.safeParse({
          code: "",
          translations: validTranslation,
        });
        expect(result.success).toBe(false);
      });

      it("rejects descriptor codes longer than 30 characters", () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 31, maxLength: 60 }).filter((s) => s.trim().length > 0),
            (code) => {
              const result = adminDescriptorFormSchema.safeParse({
                code,
                translations: validTranslation,
              });
              expect(result.success).toBe(false);
            }
          ),
          { numRuns: 30 }
        );
      });
    });
  });

  /**
   * Feature: admin-age-classification, Property 5: Rejet des donnÃ©es invalides
   *
   * _Pour toute_ requÃªte API avec des donnÃ©es ne respectant pas le schÃ©ma Zod
   * (champs obligatoires manquants, types incorrects, Ã¢ge minimum nÃ©gatif),
   * safeParse retourne success: false.
   *
   * **Validates: Requirements 3.3, 7.3, 14.1**
   */
  describe("Property 5: Rejet des donnÃ©es invalides", () => {
    // Feature: admin-age-classification, Property 5: Rejet des donnÃ©es invalides

    describe("Rating System schema", () => {
      it("accepts all valid rating system form data", () => {
        fc.assert(
          fc.property(validRatingSystemFormGenerator, (data) => {
            const result = adminRatingSystemFormSchema.safeParse(data);
            expect(result.success).toBe(true);
          }),
          { numRuns: 200 }
        );
      });

      it("rejects rating system with empty name", () => {
        fc.assert(
          fc.property(validRatingSystemCodeGenerator, (code) => {
            const result = adminRatingSystemFormSchema.safeParse({ code, name: "" });
            expect(result.success).toBe(false);
          }),
          { numRuns: 30 }
        );
      });

      it("rejects rating system with name exceeding 100 chars", () => {
        fc.assert(
          fc.property(
            validRatingSystemCodeGenerator,
            fc.string({ minLength: 101, maxLength: 200 }),
            (code, name) => {
              const result = adminRatingSystemFormSchema.safeParse({ code, name });
              expect(result.success).toBe(false);
            }
          ),
          { numRuns: 30 }
        );
      });

      it("rejects rating system with invalid website_url", () => {
        fc.assert(
          fc.property(
            validRatingSystemCodeGenerator,
            validNameGenerator,
            invalidUrlGenerator,
            (code, name, website_url) => {
              const result = adminRatingSystemFormSchema.safeParse({
                code,
                name,
                website_url,
              });
              expect(result.success).toBe(false);
            }
          ),
          { numRuns: 30 }
        );
      });

      it("rejects rating system with description exceeding 500 chars", () => {
        fc.assert(
          fc.property(
            validRatingSystemCodeGenerator,
            validNameGenerator,
            fc.string({ minLength: 501, maxLength: 700 }),
            (code, name, description) => {
              const result = adminRatingSystemFormSchema.safeParse({
                code,
                name,
                description,
              });
              expect(result.success).toBe(false);
            }
          ),
          { numRuns: 30 }
        );
      });
    });

    describe("Rating schema", () => {
      it("accepts all valid rating form data", () => {
        fc.assert(
          fc.property(validRatingFormGenerator, (data) => {
            const result = adminRatingFormSchema.safeParse(data);
            expect(result.success).toBe(true);
          }),
          { numRuns: 200 }
        );
      });

      it("rejects rating with negative minimum_age", () => {
        fc.assert(
          fc.property(
            validRatingCodeGenerator,
            validDisplayNameGenerator,
            negativeAgeGenerator,
            (code, display_name, minimum_age) => {
              const result = adminRatingFormSchema.safeParse({
                code,
                display_name,
                minimum_age,
              });
              expect(result.success).toBe(false);
            }
          ),
          { numRuns: 30 }
        );
      });

      it("rejects rating with non-integer minimum_age", () => {
        fc.assert(
          fc.property(
            validRatingCodeGenerator,
            validDisplayNameGenerator,
            nonIntegerAgeGenerator,
            (code, display_name, minimum_age) => {
              const result = adminRatingFormSchema.safeParse({
                code,
                display_name,
                minimum_age,
              });
              expect(result.success).toBe(false);
            }
          ),
          { numRuns: 30 }
        );
      });

      it("rejects rating with invalid color_hex", () => {
        fc.assert(
          fc.property(
            validRatingCodeGenerator,
            validDisplayNameGenerator,
            invalidColorHexGenerator,
            (code, display_name, color_hex) => {
              const result = adminRatingFormSchema.safeParse({
                code,
                display_name,
                minimum_age: 0,
                color_hex,
              });
              expect(result.success).toBe(false);
            }
          ),
          { numRuns: 30 }
        );
      });

      it("rejects rating with invalid icon_url", () => {
        fc.assert(
          fc.property(
            validRatingCodeGenerator,
            validDisplayNameGenerator,
            invalidUrlGenerator,
            (code, display_name, icon_url) => {
              const result = adminRatingFormSchema.safeParse({
                code,
                display_name,
                minimum_age: 0,
                icon_url,
              });
              expect(result.success).toBe(false);
            }
          ),
          { numRuns: 30 }
        );
      });

      it("rejects rating with empty display_name", () => {
        fc.assert(
          fc.property(validRatingCodeGenerator, (code) => {
            const result = adminRatingFormSchema.safeParse({
              code,
              display_name: "",
              minimum_age: 0,
            });
            expect(result.success).toBe(false);
          }),
          { numRuns: 30 }
        );
      });

      it("rejects rating with negative sort_order", () => {
        fc.assert(
          fc.property(
            validRatingCodeGenerator,
            validDisplayNameGenerator,
            fc.integer({ min: -1000, max: -1 }),
            (code, display_name, sort_order) => {
              const result = adminRatingFormSchema.safeParse({
                code,
                display_name,
                minimum_age: 0,
                sort_order,
              });
              expect(result.success).toBe(false);
            }
          ),
          { numRuns: 30 }
        );
      });
    });

    describe("Descriptor schema", () => {
      it("accepts all valid descriptor form data", () => {
        fc.assert(
          fc.property(validDescriptorFormGenerator, (data) => {
            const result = adminDescriptorFormSchema.safeParse(data);
            expect(result.success).toBe(true);
          }),
          { numRuns: 200 }
        );
      });

      it("rejects descriptor with empty translations array", () => {
        fc.assert(
          fc.property(validDescriptorCodeGenerator, (code) => {
            const result = adminDescriptorFormSchema.safeParse({
              code,
              translations: [],
            });
            expect(result.success).toBe(false);
          }),
          { numRuns: 30 }
        );
      });

      it("rejects descriptor with invalid icon_url", () => {
        fc.assert(
          fc.property(
            validDescriptorCodeGenerator,
            invalidUrlGenerator,
            validTranslationsArrayGenerator,
            (code, icon_url, translations) => {
              const result = adminDescriptorFormSchema.safeParse({
                code,
                icon_url,
                translations,
              });
              expect(result.success).toBe(false);
            }
          ),
          { numRuns: 30 }
        );
      });

      it("rejects translation with empty name", () => {
        fc.assert(
          fc.property(validLanguageCodeGenerator, (language_code) => {
            const result = descriptorTranslationSchema.safeParse({
              language_code,
              name: "",
            });
            expect(result.success).toBe(false);
          }),
          { numRuns: 30 }
        );
      });

      it("rejects translation with name exceeding 100 chars", () => {
        fc.assert(
          fc.property(
            validLanguageCodeGenerator,
            fc.string({ minLength: 101, maxLength: 200 }),
            (language_code, name) => {
              const result = descriptorTranslationSchema.safeParse({
                language_code,
                name,
              });
              expect(result.success).toBe(false);
            }
          ),
          { numRuns: 30 }
        );
      });

      it("rejects translation with description exceeding 500 chars", () => {
        fc.assert(
          fc.property(
            validLanguageCodeGenerator,
            fc.string({ minLength: 1, maxLength: 100 }),
            fc.string({ minLength: 501, maxLength: 700 }),
            (language_code, name, description) => {
              const result = descriptorTranslationSchema.safeParse({
                language_code,
                name,
                description,
              });
              expect(result.success).toBe(false);
            }
          ),
          { numRuns: 30 }
        );
      });
    });
  });
});
