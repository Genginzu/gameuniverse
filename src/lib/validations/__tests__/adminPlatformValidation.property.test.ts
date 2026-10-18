import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  adminPlatformFormSchema,
  platformQuerySchema,
} from "@/lib/validations/admin-platform-form";

// --- Generators ---

const validSlugGen = fc.stringMatching(/^[a-z][a-z0-9-]{1,20}[a-z0-9]$/);
// Must contain at least one non-space character to pass the .trim().length > 0 refine
const validNameGen = fc.stringMatching(/^[A-Za-z0-9][A-Za-z0-9 ]{0,49}$/);
const invalidSlugGen = fc.constantFrom(
  "",
  "A",
  "UPPER",
  "PlayStation5",
  "has spaces",
  "-start",
  "end-"
);
const EN_TRANSLATION = [{ language_code: "en", name: "PlayStation 5" }];

/**
 * Feature: game-platforms, Property 10: Admin platform validation
 *
 * Payloads missing a valid slug or every translation name are rejected; a valid
 * slug with at least one FR or EN translation is accepted.
 *
 * **Validates: Requirements 7.2, 7.5**
 */
describe("Property 10: Admin platform validation", () => {
  it("rejects payloads without a valid slug", () => {
    fc.assert(
      fc.property(invalidSlugGen, validNameGen, (slug, name) => {
        const payload = { slug, translations: [{ language_code: "en", name }] };
        expect(adminPlatformFormSchema.safeParse(payload).success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects a payload with no slug at all", () => {
    expect(adminPlatformFormSchema.safeParse({ translations: EN_TRANSLATION }).success).toBe(false);
  });

  it("rejects payloads without any translation name", () => {
    fc.assert(
      fc.property(validSlugGen, (slug) => {
        expect(adminPlatformFormSchema.safeParse({ slug, translations: [] }).success).toBe(false);
        const emptyNames = [
          { language_code: "fr", name: "" },
          { language_code: "en", name: "" },
        ];
        expect(adminPlatformFormSchema.safeParse({ slug, translations: emptyNames }).success).toBe(
          false
        );
      }),
      { numRuns: 100 }
    );
  });

  it("accepts valid payloads with slug and at least one translation", () => {
    fc.assert(
      fc.property(validSlugGen, validNameGen, fc.constantFrom("fr", "en"), (slug, name, lang) => {
        const payload = { slug, translations: [{ language_code: lang, name }] };
        expect(adminPlatformFormSchema.safeParse(payload).success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("keeps an optional abbreviation and accepts an empty one", () => {
    const withAbbr = adminPlatformFormSchema.parse({
      slug: "ps5",
      translations: [{ language_code: "en", name: "PlayStation 5", abbreviation: "PS5" }],
    });
    expect(withAbbr.translations[0].abbreviation).toBe("PS5");

    const emptyAbbr = adminPlatformFormSchema.safeParse({
      slug: "ps5",
      translations: [{ language_code: "en", name: "PlayStation 5", abbreviation: "" }],
    });
    expect(emptyAbbr.success).toBe(true);
  });

  it("accepts an optional iconUrl", () => {
    const result = adminPlatformFormSchema.safeParse({
      slug: "ps5",
      iconUrl: "https://example.com/ps5.png",
      translations: EN_TRANSLATION,
    });
    expect(result.success).toBe(true);
  });
});

describe("platformQuerySchema", () => {
  it("applies defaults for empty input", () => {
    expect(platformQuerySchema.parse({})).toMatchObject({
      page: 1,
      limit: 20,
      sort_by: "slug",
      sort_order: "asc",
      locale: "fr",
    });
  });

  it("coerces string page/limit to numbers", () => {
    expect(platformQuerySchema.parse({ page: "3", limit: "50" })).toMatchObject({
      page: 3,
      limit: 50,
    });
  });

  it("rejects limit > 100", () => {
    expect(platformQuerySchema.safeParse({ limit: "200" }).success).toBe(false);
  });
});
