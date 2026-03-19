import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { adminPlatformFormSchema } from "@/lib/validations/admin-platform-form";

// --- Generators ---

const validSlugGen = fc.stringMatching(/^[a-z][a-z0-9-]{1,20}[a-z0-9]$/);
// Must contain at least one non-space character to pass the .trim().length > 0 refine
const validNameGen = fc.stringMatching(/^[A-Za-z0-9][A-Za-z0-9 ]{0,49}$/);
const invalidSlugGen = fc.constantFrom("", "A", "UPPER", "has spaces", "-start", "end-");

/**
 * Feature: game-platforms, Property 10: Admin platform validation
 *
 * For any platform creation payload, the validation schema must reject payloads
 * missing a slug or missing all translations (at least one of FR or EN name is
 * required). Valid payloads with a unique slug and at least one translation must
 * be accepted.
 *
 * **Validates: Requirements 7.2**
 */
describe("Property 10: Admin platform validation", () => {
  it("rejects payloads without a valid slug", () => {
    fc.assert(
      fc.property(invalidSlugGen, validNameGen, (slug, name) => {
        const payload = {
          slug,
          translations: [{ language_code: "en", name }],
        };
        const result = adminPlatformFormSchema.safeParse(payload);
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects payloads without any translation name", () => {
    fc.assert(
      fc.property(validSlugGen, (slug) => {
        // Empty translations array
        const payload1 = { slug, translations: [] };
        const result1 = adminPlatformFormSchema.safeParse(payload1);
        expect(result1.success).toBe(false);

        // Translations with empty names
        const payload2 = {
          slug,
          translations: [
            { language_code: "fr", name: "" },
            { language_code: "en", name: "" },
          ],
        };
        const result2 = adminPlatformFormSchema.safeParse(payload2);
        expect(result2.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("accepts valid payloads with slug and at least one translation", () => {
    const langCodeGen = fc.constantFrom("fr", "en");

    fc.assert(
      fc.property(validSlugGen, validNameGen, langCodeGen, (slug, name, langCode) => {
        const payload = {
          slug,
          translations: [{ language_code: langCode, name }],
        };
        const result = adminPlatformFormSchema.safeParse(payload);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("accepts payloads with optional abbreviation", () => {
    fc.assert(
      fc.property(validSlugGen, validNameGen, (slug, name) => {
        const payload = {
          slug,
          translations: [{ language_code: "en", name, abbreviation: "PS5" }],
        };
        const result = adminPlatformFormSchema.safeParse(payload);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
