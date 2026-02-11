import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import { adminCharacterFormSchema } from "../../../../src/lib/validations/admin-character-form";

// --- Shared generators ---

/** Valid slug: lowercase letters, digits, hyphens, 1-255 chars */
const validSlugGenerator = fc
  .stringMatching(/^[a-z0-9][a-z0-9-]*$/)
  .filter((s) => s.length >= 1 && s.length <= 255);

/** Valid translation with a non-empty name */
const validTranslationWithName = fc.record({
  language_code: fc.constantFrom("fr", "en"),
  name: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
  role: fc.oneof(fc.constant(""), fc.string({ minLength: 1, maxLength: 50 })),
  description: fc.oneof(fc.constant(""), fc.string({ minLength: 1, maxLength: 200 })),
  biography: fc.oneof(fc.constant(""), fc.string({ minLength: 1, maxLength: 200 })),
});

/** Minimal valid form data for use in focused property tests */
const minimalValidFormData = (overrides: Record<string, unknown> = {}) =>
  fc.record({
    slug: validSlugGenerator,
    translations: fc.array(validTranslationWithName, { minLength: 1, maxLength: 2 }),
    ...overrides,
  });

// =============================================================================
// Property 1: Slug validation
// =============================================================================

/**
 * Feature: admin-character-management, Property 1: Slug validation
 *
 * _For any_ slug composed only of lowercase letters, digits, and hyphens,
 * with length between 1 and 255, the schema MUST accept it.
 * _For any_ string containing uppercase, spaces, special chars, or with
 * length 0 or > 255, the schema MUST reject it.
 *
 * **Validates: Requirements 5.1**
 */
describe("Property 1: Slug validation", () => {
  it("accepts valid slugs (lowercase, digits, hyphens, 1-255 chars)", () => {
    fc.assert(
      fc.property(validSlugGenerator, validTranslationWithName, (slug, translation) => {
        const result = adminCharacterFormSchema.safeParse({
          slug,
          translations: [translation],
        });
        expect(result.success).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it("rejects empty slugs", () => {
    fc.assert(
      fc.property(validTranslationWithName, (translation) => {
        const result = adminCharacterFormSchema.safeParse({
          slug: "",
          translations: [translation],
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects slugs longer than 255 characters", () => {
    const longSlugGenerator = fc
      .array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789-".split("")), {
        minLength: 256,
        maxLength: 300,
      })
      .map((chars) => chars.join(""));

    fc.assert(
      fc.property(longSlugGenerator, validTranslationWithName, (slug, translation) => {
        const result = adminCharacterFormSchema.safeParse({
          slug,
          translations: [translation],
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects slugs with uppercase letters", () => {
    const uppercaseSlugGenerator = fc
      .stringMatching(/^[a-z0-9-]*[A-Z][a-z0-9A-Z-]*$/)
      .filter((s) => s.length >= 1 && s.length <= 255);

    fc.assert(
      fc.property(uppercaseSlugGenerator, validTranslationWithName, (slug, translation) => {
        const result = adminCharacterFormSchema.safeParse({
          slug,
          translations: [translation],
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects slugs with spaces or special characters", () => {
    const specialCharSlugGenerator = fc
      .stringMatching(/^[a-z0-9-]*[^a-z0-9-][a-z0-9-]*$/)
      .filter((s) => s.length >= 1 && s.length <= 255);

    fc.assert(
      fc.property(specialCharSlugGenerator, validTranslationWithName, (slug, translation) => {
        const result = adminCharacterFormSchema.safeParse({
          slug,
          translations: [translation],
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

// =============================================================================
// Property 2: Translation name validation
// =============================================================================

/**
 * Feature: admin-character-management, Property 2: Translation name validation
 *
 * _For any_ translations array where all `name` fields are empty or whitespace-only,
 * the schema MUST reject. _For any_ array with at least one non-empty name (after trim),
 * the schema MUST accept (if other fields are valid).
 *
 * **Validates: Requirements 5.2, 2.4**
 */
describe("Property 2: Translation name validation", () => {
  it("rejects when all translation names are empty or whitespace", () => {
    const emptyNameTranslation = fc.record({
      language_code: fc.constantFrom("fr", "en"),
      name: fc.oneof(fc.constant(""), fc.constant("   "), fc.constant("\t\n")),
      role: fc.constant(""),
      description: fc.constant(""),
      biography: fc.constant(""),
    });

    fc.assert(
      fc.property(
        validSlugGenerator,
        fc.array(emptyNameTranslation, { minLength: 1, maxLength: 3 }),
        (slug, translations) => {
          const result = adminCharacterFormSchema.safeParse({ slug, translations });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("accepts when at least one translation has a non-empty name", () => {
    const emptyNameTranslation = fc.record({
      language_code: fc.constant("en"),
      name: fc.constant(""),
      role: fc.constant(""),
      description: fc.constant(""),
      biography: fc.constant(""),
    });

    fc.assert(
      fc.property(
        validSlugGenerator,
        validTranslationWithName,
        fc.array(emptyNameTranslation, { minLength: 0, maxLength: 2 }),
        (slug, validTranslation, emptyTranslations) => {
          const translations = [validTranslation, ...emptyTranslations];
          const result = adminCharacterFormSchema.safeParse({ slug, translations });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("rejects when translations array is empty", () => {
    fc.assert(
      fc.property(validSlugGenerator, (slug) => {
        const result = adminCharacterFormSchema.safeParse({ slug, translations: [] });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

// =============================================================================
// Property 5: URL and color validation
// =============================================================================

/**
 * Feature: admin-character-management, Property 5: URL and color validation
 *
 * _For any_ valid URL (http:// or https://), main_image_url and background_image_url
 * MUST be accepted. _For any_ string that is neither a valid URL nor empty, the schema
 * MUST reject. Similarly, _for any_ hex color (#XXXXXX), background_color MUST be
 * accepted, and non-hex non-empty strings MUST be rejected.
 *
 * **Validates: Requirements 5.3, 5.4**
 */
describe("Property 5: URL and color validation", () => {
  describe("Image URLs", () => {
    it("accepts valid URLs for main_image_url", () => {
      fc.assert(
        fc.property(
          validSlugGenerator,
          validTranslationWithName,
          fc.webUrl(),
          (slug, translation, url) => {
            const result = adminCharacterFormSchema.safeParse({
              slug,
              translations: [translation],
              main_image_url: url,
            });
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("accepts valid URLs for background_image_url", () => {
      fc.assert(
        fc.property(
          validSlugGenerator,
          validTranslationWithName,
          fc.webUrl(),
          (slug, translation, url) => {
            const result = adminCharacterFormSchema.safeParse({
              slug,
              translations: [translation],
              background_image_url: url,
            });
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("accepts empty strings for image URLs", () => {
      fc.assert(
        fc.property(validSlugGenerator, validTranslationWithName, (slug, translation) => {
          const result = adminCharacterFormSchema.safeParse({
            slug,
            translations: [translation],
            main_image_url: "",
            background_image_url: "",
          });
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects invalid non-empty strings for main_image_url", () => {
      const invalidUrlGenerator = fc.string({ minLength: 1, maxLength: 100 }).filter((s) => {
        try {
          new URL(s);
          return false;
        } catch {
          return s !== "";
        }
      });

      fc.assert(
        fc.property(
          validSlugGenerator,
          validTranslationWithName,
          invalidUrlGenerator,
          (slug, translation, invalidUrl) => {
            const result = adminCharacterFormSchema.safeParse({
              slug,
              translations: [translation],
              main_image_url: invalidUrl,
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects invalid non-empty strings for background_image_url", () => {
      const invalidUrlGenerator = fc.string({ minLength: 1, maxLength: 100 }).filter((s) => {
        try {
          new URL(s);
          return false;
        } catch {
          return s !== "";
        }
      });

      fc.assert(
        fc.property(
          validSlugGenerator,
          validTranslationWithName,
          invalidUrlGenerator,
          (slug, translation, invalidUrl) => {
            const result = adminCharacterFormSchema.safeParse({
              slug,
              translations: [translation],
              background_image_url: invalidUrl,
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Background color", () => {
    it("accepts valid hex colors (#XXXXXX)", () => {
      const validHexColor = fc
        .array(fc.constantFrom(..."0123456789abcdefABCDEF".split("")), {
          minLength: 6,
          maxLength: 6,
        })
        .map((chars) => `#${chars.join("")}`);

      fc.assert(
        fc.property(
          validSlugGenerator,
          validTranslationWithName,
          validHexColor,
          (slug, translation, color) => {
            const result = adminCharacterFormSchema.safeParse({
              slug,
              translations: [translation],
              background_color: color,
            });
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("accepts empty string for background_color", () => {
      fc.assert(
        fc.property(validSlugGenerator, validTranslationWithName, (slug, translation) => {
          const result = adminCharacterFormSchema.safeParse({
            slug,
            translations: [translation],
            background_color: "",
          });
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects invalid non-empty background_color strings", () => {
      const invalidColorGenerator = fc
        .string({ minLength: 1, maxLength: 20 })
        .filter((s) => s !== "" && !/^#[0-9a-fA-F]{6}$/.test(s));

      fc.assert(
        fc.property(
          validSlugGenerator,
          validTranslationWithName,
          invalidColorGenerator,
          (slug, translation, color) => {
            const result = adminCharacterFormSchema.safeParse({
              slug,
              translations: [translation],
              background_color: color,
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
