import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// --- Pure translation resolution logic (mirrors server-side behavior) ---

interface PlatformTranslation {
  language_code: string;
  name: string;
}

/**
 * Resolves the platform name for a given locale with EN fallback.
 * This mirrors the SQL/service logic: prefer requested locale, fallback to EN.
 */
function resolveTranslation(
  translations: PlatformTranslation[],
  locale: string,
  slugFallback: string
): string {
  const localeTranslation = translations.find((t) => t.language_code === locale);
  if (localeTranslation) return localeTranslation.name;

  const enTranslation = translations.find((t) => t.language_code === "en");
  if (enTranslation) return enTranslation.name;

  return slugFallback;
}

// --- Generators ---

const nameGen = fc.stringMatching(/^[A-Za-z0-9 ]{2,30}$/);
const slugGen = fc.stringMatching(/^[a-z][a-z0-9-]{1,14}[a-z0-9]$/);

/**
 * Feature: game-platforms, Property 12: Locale translation with English fallback
 *
 * For any platform and any supported locale, the service must return the
 * translation for that locale if it exists. If the translation does not exist
 * for the requested locale, the service must return the English translation
 * as fallback.
 *
 * **Validates: Requirements 8.1, 8.2**
 */
describe("Property 12: Locale translation with English fallback", () => {
  it("returns locale translation when it exists", () => {
    const localeGen = fc.constantFrom("fr", "en");

    fc.assert(
      fc.property(slugGen, nameGen, nameGen, localeGen, (slug, frName, enName, locale) => {
        const translations: PlatformTranslation[] = [
          { language_code: "fr", name: frName },
          { language_code: "en", name: enName },
        ];

        const result = resolveTranslation(translations, locale, slug);
        const expected = locale === "fr" ? frName : enName;
        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it("falls back to EN when requested locale is missing", () => {
    fc.assert(
      fc.property(slugGen, nameGen, (slug, enName) => {
        // Only EN translation exists, requesting FR
        const translations: PlatformTranslation[] = [{ language_code: "en", name: enName }];

        const result = resolveTranslation(translations, "fr", slug);
        expect(result).toBe(enName);
      }),
      { numRuns: 100 }
    );
  });

  it("falls back to slug when no translations exist", () => {
    fc.assert(
      fc.property(slugGen, (slug) => {
        const result = resolveTranslation([], "fr", slug);
        expect(result).toBe(slug);
      }),
      { numRuns: 100 }
    );
  });

  it("prefers exact locale match over EN fallback", () => {
    fc.assert(
      fc.property(slugGen, nameGen, nameGen, (slug, frName, enName) => {
        const translations: PlatformTranslation[] = [
          { language_code: "fr", name: frName },
          { language_code: "en", name: enName },
        ];

        const result = resolveTranslation(translations, "fr", slug);
        expect(result).toBe(frName);
      }),
      { numRuns: 100 }
    );
  });
});
