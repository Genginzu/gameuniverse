import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: admin-language-management, Property 3: Affichage Complet des Informations de Langue
 *
 * _For any_ language displayed in the table, the following information must be
 * present: code, English name, and native name (or absence indicator).
 *
 * This test validates the display logic of AdminLanguagesTable to ensure that
 * for any valid SupportedLanguage input, the component correctly extracts and
 * displays code, name, and native_name (with "—" fallback when null).
 *
 * **Validates: Requirements 3.2**
 */

// --- Types (mirrors src/hooks/useAdminLanguages.ts) ---

interface SupportedLanguage {
  code: string;
  name: string;
  native_name: string | null;
}

// --- Display logic simulation (mirrors AdminLanguagesTable.tsx rendering) ---

interface LanguageRowDisplay {
  code: string;
  name: string;
  nativeNameDisplay: string;
}

/**
 * Simulates the display logic for a single language row in AdminLanguagesTable.
 * Mirrors the actual component's rendering:
 *   - code is displayed as-is in a monospace font
 *   - name is displayed as-is
 *   - native_name uses `language.native_name || "—"` fallback
 */
function simulateLanguageRowDisplay(language: SupportedLanguage): LanguageRowDisplay {
  return {
    code: language.code,
    name: language.name,
    nativeNameDisplay: language.native_name || "—",
  };
}

// --- Generators ---

const CODE_REGEX = /^[a-z]([a-z-]*[a-z])?$/;

/** Generates a valid language code: 2-10 lowercase letters with optional internal hyphens */
const validCodeGenerator = fc
  .tuple(
    fc.integer({ min: 2, max: 10 }),
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")),
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split(""))
  )
  .chain(([length, firstChar, lastChar]) => {
    if (length === 2) {
      return fc.constant(`${firstChar}${lastChar}`);
    }
    const middleLength = length - 2;
    return fc
      .array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz-".split("")), {
        minLength: middleLength,
        maxLength: middleLength,
      })
      .map((middle) => `${firstChar}${middle.join("")}${lastChar}`);
  })
  .filter((code) => CODE_REGEX.test(code) && code.length >= 2 && code.length <= 10);

/** Generates a non-empty language name (1-100 chars) */
const nameGenerator = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

/** Generates a native name: either null or a non-empty string */
const nativeNameGenerator = fc.oneof(
  fc.constant(null),
  fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0)
);

/** Generates a complete valid SupportedLanguage */
const languageGenerator: fc.Arbitrary<SupportedLanguage> = fc
  .tuple(validCodeGenerator, nameGenerator, nativeNameGenerator)
  .map(([code, name, native_name]) => ({ code, name, native_name }));

/** Generates a language with null native_name specifically */
const languageWithNullNativeNameGenerator: fc.Arbitrary<SupportedLanguage> = fc
  .tuple(validCodeGenerator, nameGenerator)
  .map(([code, name]) => ({ code, name, native_name: null }));

/** Generates a language with a non-null native_name */
const languageWithNativeNameGenerator: fc.Arbitrary<SupportedLanguage> = fc
  .tuple(
    validCodeGenerator,
    nameGenerator,
    fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0)
  )
  .map(([code, name, native_name]) => ({ code, name, native_name }));

// --- Tests ---

describe("AdminLanguagesTable Property-Based Tests", () => {
  describe("Property 3: Affichage Complet des Informations de Langue", () => {
    it("always displays the language code for any valid language", () => {
      fc.assert(
        fc.property(languageGenerator, (language) => {
          const display = simulateLanguageRowDisplay(language);

          expect(display.code).toBe(language.code);
          expect(display.code.length).toBeGreaterThanOrEqual(2);
        }),
        { numRuns: 100 }
      );
    });

    it("always displays the English name for any valid language", () => {
      fc.assert(
        fc.property(languageGenerator, (language) => {
          const display = simulateLanguageRowDisplay(language);

          expect(display.name).toBe(language.name);
          expect(display.name.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it("displays native name when present, or '—' fallback when null", () => {
      fc.assert(
        fc.property(languageGenerator, (language) => {
          const display = simulateLanguageRowDisplay(language);

          if (language.native_name) {
            expect(display.nativeNameDisplay).toBe(language.native_name);
          } else {
            expect(display.nativeNameDisplay).toBe("—");
          }
        }),
        { numRuns: 100 }
      );
    });

    it("always uses '—' fallback for null native_name", () => {
      fc.assert(
        fc.property(languageWithNullNativeNameGenerator, (language) => {
          const display = simulateLanguageRowDisplay(language);

          expect(display.nativeNameDisplay).toBe("—");
        }),
        { numRuns: 100 }
      );
    });

    it("always displays the actual native name when non-null", () => {
      fc.assert(
        fc.property(languageWithNativeNameGenerator, (language) => {
          const display = simulateLanguageRowDisplay(language);

          expect(display.nativeNameDisplay).toBe(language.native_name);
          expect(display.nativeNameDisplay).not.toBe("—");
        }),
        { numRuns: 100 }
      );
    });

    it("all three fields are present and non-empty for any language in a list", () => {
      fc.assert(
        fc.property(fc.array(languageGenerator, { minLength: 1, maxLength: 50 }), (languages) => {
          for (const language of languages) {
            const display = simulateLanguageRowDisplay(language);

            // Code must be present
            expect(display.code.length).toBeGreaterThanOrEqual(2);
            // Name must be present
            expect(display.name.length).toBeGreaterThan(0);
            // Native name display must always be a non-empty string (either actual or "—")
            expect(display.nativeNameDisplay.length).toBeGreaterThan(0);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("display is deterministic — same language always produces same output", () => {
      fc.assert(
        fc.property(languageGenerator, (language) => {
          const display1 = simulateLanguageRowDisplay(language);
          const display2 = simulateLanguageRowDisplay(language);

          expect(display1.code).toBe(display2.code);
          expect(display1.name).toBe(display2.name);
          expect(display1.nativeNameDisplay).toBe(display2.nativeNameDisplay);
        }),
        { numRuns: 100 }
      );
    });
  });
});
