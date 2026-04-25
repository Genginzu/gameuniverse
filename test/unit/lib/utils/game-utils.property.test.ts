import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  getGameColors,
  buildGameColors,
  formatReleaseDate,
  formatPrice,
  getMetascoreColor,
  GameColors,
} from "../../../../src/lib/utils/game-utils";

/**
 * Feature: code-refactoring
 * Property 10: Game Color Scheme Generation
 * Property 11: Formatting Utilities Correctness
 * **Validates: Requirements 14.6, 14.7**
 */

// Generators for property-based testing
const gameTitleGenerator = fc.string({ minLength: 1, maxLength: 100 });
const genreGenerator = fc.array(fc.string({ minLength: 1, maxLength: 30 }), {
  minLength: 0,
  maxLength: 10,
});

// Valid CSS hex color pattern
const hexColorPattern = /^#[0-9a-fA-F]{6}$/;

// Valid Tailwind gradient pattern
const tailwindGradientPattern = /^from-[a-z-]+-\d+\/\d+ to-[a-z-]+-\d+\/\d+$/;

// Valid date string generator (ISO format) - using integer-based approach for reliability
const validDateGenerator = fc.integer({ min: 1970, max: 2050 }).chain((year) =>
  fc.integer({ min: 1, max: 12 }).chain((month) =>
    fc.integer({ min: 1, max: 28 }).map((day) => {
      const monthStr = month.toString().padStart(2, "0");
      const dayStr = day.toString().padStart(2, "0");
      return `${year}-${monthStr}-${dayStr}`;
    })
  )
);

// Locale generator
const localeGenerator = fc.constantFrom("en", "en-US", "fr", "fr-FR", "de", "es", "ja", "zh");

// Currency generator
const currencyGenerator = fc.constantFrom("USD", "EUR", "GBP", "JPY", "CAD", "AUD");

// Price generator
const priceGenerator = fc.float({ min: 0, max: 1000, noNaN: true });

// Metascore generator (0-100 or undefined)
const metascoreGenerator = fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined });

describe("Game Utilities Property-Based Tests", () => {
  describe("Property 10: Game Color Scheme Generation", () => {
    describe("getGameColors", () => {
      it("returns valid GameColors object for any game title and genres", () => {
        fc.assert(
          fc.property(gameTitleGenerator, genreGenerator, (title, genres) => {
            const colors = getGameColors(title, genres);

            // Verify structure
            expect(colors).toHaveProperty("primary");
            expect(colors).toHaveProperty("secondary");
            expect(colors).toHaveProperty("accent");
            expect(colors).toHaveProperty("bg");

            // Verify types
            expect(typeof colors.primary).toBe("string");
            expect(typeof colors.secondary).toBe("string");
            expect(typeof colors.accent).toBe("string");
            expect(typeof colors.bg).toBe("string");
          }),
          { numRuns: 30 }
        );
      });

      it("returns valid CSS hex colors for primary, secondary, and accent", () => {
        fc.assert(
          fc.property(gameTitleGenerator, genreGenerator, (title, genres) => {
            const colors = getGameColors(title, genres);

            expect(colors.primary).toMatch(hexColorPattern);
            expect(colors.secondary).toMatch(hexColorPattern);
            expect(colors.accent).toMatch(hexColorPattern);
          }),
          { numRuns: 30 }
        );
      });

      it("returns valid Tailwind gradient class for bg", () => {
        fc.assert(
          fc.property(gameTitleGenerator, genreGenerator, (title, genres) => {
            const colors = getGameColors(title, genres);

            expect(colors.bg).toMatch(tailwindGradientPattern);
          }),
          { numRuns: 30 }
        );
      });

      it("returns amber colors for Witcher titles", () => {
        const witcherTitles = [
          "The Witcher 3",
          "witcher",
          "WITCHER",
          "The Witcher: Wild Hunt",
          "Witcher 2",
        ];

        for (const title of witcherTitles) {
          const colors = getGameColors(title, []);
          expect(colors.primary).toBe("#f59e0b");
          expect(colors.bg).toContain("amber");
        }
      });

      it("returns cyan colors for Cyberpunk titles", () => {
        const cyberpunkTitles = [
          "Cyberpunk 2077",
          "cyberpunk",
          "CYBERPUNK",
          "Cyberpunk: Edgerunners",
        ];

        for (const title of cyberpunkTitles) {
          const colors = getGameColors(title, []);
          expect(colors.primary).toBe("#0697e0");
          expect(colors.bg).toContain("palette-secondary");
        }
      });

      it("returns emerald colors for Minecraft titles", () => {
        const minecraftTitles = ["Minecraft", "minecraft", "MINECRAFT", "Minecraft Dungeons"];

        for (const title of minecraftTitles) {
          const colors = getGameColors(title, []);
          expect(colors.primary).toBe("#10b981");
          expect(colors.bg).toContain("emerald");
        }
      });

      it("returns default violet colors for unknown titles", () => {
        const unknownTitles = ["Some Random Game", "Test Game", "Unknown Title", ""];

        for (const title of unknownTitles) {
          const colors = getGameColors(title, []);
          expect(colors.primary).toBe("#0077e6");
          expect(colors.bg).toContain("palette-primary");
        }
      });

      it("is deterministic - same input produces same output", () => {
        fc.assert(
          fc.property(gameTitleGenerator, genreGenerator, (title, genres) => {
            const colors1 = getGameColors(title, genres);
            const colors2 = getGameColors(title, genres);

            expect(colors1).toEqual(colors2);
          }),
          { numRuns: 30 }
        );
      });
    });
  });

  describe("Property 11: Formatting Utilities Correctness", () => {
    describe("formatReleaseDate", () => {
      it("returns null for undefined input", () => {
        fc.assert(
          fc.property(localeGenerator, (locale) => {
            const result = formatReleaseDate(undefined, locale);
            expect(result).toBeNull();
          }),
          { numRuns: 30 }
        );
      });

      it("returns a non-empty string for valid date input", () => {
        fc.assert(
          fc.property(validDateGenerator, localeGenerator, (dateString, locale) => {
            const result = formatReleaseDate(dateString, locale);

            expect(result).not.toBeNull();
            expect(typeof result).toBe("string");
            expect(result!.length).toBeGreaterThan(0);
          }),
          { numRuns: 30 }
        );
      });

      it("formats dates consistently for the same locale", () => {
        fc.assert(
          fc.property(validDateGenerator, localeGenerator, (dateString, locale) => {
            const result1 = formatReleaseDate(dateString, locale);
            const result2 = formatReleaseDate(dateString, locale);

            expect(result1).toBe(result2);
          }),
          { numRuns: 30 }
        );
      });

      it("includes year, month, and day in the formatted output", () => {
        // Test with a known date
        const result = formatReleaseDate("2023-05-15", "en-US");
        expect(result).not.toBeNull();
        expect(result).toContain("2023");
        expect(result).toContain("15");
        // Month name varies by locale, but should be present
      });
    });

    describe("formatPrice", () => {
      it("returns a non-empty string for any valid price and currency", () => {
        fc.assert(
          fc.property(
            priceGenerator,
            currencyGenerator,
            localeGenerator,
            (price, currency, locale) => {
              const result = formatPrice(price, currency, locale);

              expect(typeof result).toBe("string");
              expect(result.length).toBeGreaterThan(0);
            }
          ),
          { numRuns: 30 }
        );
      });

      it("formats the same price consistently", () => {
        fc.assert(
          fc.property(
            priceGenerator,
            currencyGenerator,
            localeGenerator,
            (price, currency, locale) => {
              const result1 = formatPrice(price, currency, locale);
              const result2 = formatPrice(price, currency, locale);

              expect(result1).toBe(result2);
            }
          ),
          { numRuns: 30 }
        );
      });

      it("includes currency symbol or code in output", () => {
        // Test with known currencies
        const usdResult = formatPrice(59.99, "USD", "en-US");
        expect(usdResult).toMatch(/\$|USD/);

        const eurResult = formatPrice(59.99, "EUR", "fr-FR");
        expect(eurResult).toMatch(/€|EUR/);
      });

      it("handles zero price", () => {
        fc.assert(
          fc.property(currencyGenerator, localeGenerator, (currency, locale) => {
            const result = formatPrice(0, currency, locale);

            expect(typeof result).toBe("string");
            expect(result.length).toBeGreaterThan(0);
          }),
          { numRuns: 30 }
        );
      });
    });

    describe("getMetascoreColor", () => {
      it("returns bg-gray-500 for undefined score", () => {
        const result = getMetascoreColor(undefined);
        expect(result).toBe("bg-gray-500");
      });

      it("returns bg-gray-500 for zero score", () => {
        const result = getMetascoreColor(0);
        expect(result).toBe("bg-gray-500");
      });

      it("returns bg-green-500 for scores >= 90", () => {
        fc.assert(
          fc.property(fc.integer({ min: 90, max: 100 }), (score) => {
            const result = getMetascoreColor(score);
            expect(result).toBe("bg-green-500");
          }),
          { numRuns: 30 }
        );
      });

      it("returns bg-green-400 for scores 75-89", () => {
        fc.assert(
          fc.property(fc.integer({ min: 75, max: 89 }), (score) => {
            const result = getMetascoreColor(score);
            expect(result).toBe("bg-green-400");
          }),
          { numRuns: 30 }
        );
      });

      it("returns bg-yellow-400 for scores 60-74", () => {
        fc.assert(
          fc.property(fc.integer({ min: 60, max: 74 }), (score) => {
            const result = getMetascoreColor(score);
            expect(result).toBe("bg-yellow-400");
          }),
          { numRuns: 30 }
        );
      });

      it("returns bg-orange-400 for scores 40-59", () => {
        fc.assert(
          fc.property(fc.integer({ min: 40, max: 59 }), (score) => {
            const result = getMetascoreColor(score);
            expect(result).toBe("bg-orange-400");
          }),
          { numRuns: 30 }
        );
      });

      it("returns bg-red-400 for scores 1-39", () => {
        fc.assert(
          fc.property(fc.integer({ min: 1, max: 39 }), (score) => {
            const result = getMetascoreColor(score);
            expect(result).toBe("bg-red-400");
          }),
          { numRuns: 30 }
        );
      });

      it("returns a valid Tailwind bg color class for any score", () => {
        fc.assert(
          fc.property(metascoreGenerator, (score) => {
            const result = getMetascoreColor(score);

            expect(result).toMatch(/^bg-[a-z]+-\d+$/);
          }),
          { numRuns: 30 }
        );
      });

      it("is deterministic - same score produces same color", () => {
        fc.assert(
          fc.property(metascoreGenerator, (score) => {
            const result1 = getMetascoreColor(score);
            const result2 = getMetascoreColor(score);

            expect(result1).toBe(result2);
          }),
          { numRuns: 30 }
        );
      });

      it("boundary test: score 39 returns red, score 40 returns orange", () => {
        expect(getMetascoreColor(39)).toBe("bg-red-400");
        expect(getMetascoreColor(40)).toBe("bg-orange-400");
      });

      it("boundary test: score 59 returns orange, score 60 returns yellow", () => {
        expect(getMetascoreColor(59)).toBe("bg-orange-400");
        expect(getMetascoreColor(60)).toBe("bg-yellow-400");
      });

      it("boundary test: score 74 returns yellow, score 75 returns green-400", () => {
        expect(getMetascoreColor(74)).toBe("bg-yellow-400");
        expect(getMetascoreColor(75)).toBe("bg-green-400");
      });

      it("boundary test: score 89 returns green-400, score 90 returns green-500", () => {
        expect(getMetascoreColor(89)).toBe("bg-green-400");
        expect(getMetascoreColor(90)).toBe("bg-green-500");
      });
    });
  });

  /**
   * Feature: admin-game-color-preview
   * Property 1: buildGameColors default merging
   *
   * For any combination of color inputs where each field is either a valid hex
   * string or null/undefined, buildGameColors() returns provided values when
   * present, or defaults (bg=#0f172a, accent=#8b5cf6, label=#94a3b8, text=#e2e8f0)
   * when absent.
   *
   * **Validates: Requirements 1.3, 5.1, 5.2**
   */
  describe("Property 1: buildGameColors default merging", () => {
    const hexColorArb = fc
      .tuple(
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 })
      )
      .map(
        ([r, g, b]) =>
          `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
      );

    const optionalHexArb = fc.oneof(hexColorArb, fc.constant(null), fc.constant(undefined));

    it("returns provided values when present, defaults when absent", () => {
      fc.assert(
        fc.property(
          optionalHexArb,
          optionalHexArb,
          optionalHexArb,
          optionalHexArb,
          (bg, accent, label, text) => {
            const colors = buildGameColors({
              backgroundColor: bg,
              accentColor: accent,
              labelColor: label,
              textColor: text,
            });

            // Each field should equal the provided value or the default
            expect(colors.backgroundColor).toBe(bg || "#0f172a");
            expect(colors.accent).toBe(accent || "#0077e6");
            expect(colors.labelColor).toBe(label || "#94a3b8");
            expect(colors.textColor).toBe(text || "#e2e8f0");

            // primary and secondary mirror accent
            expect(colors.primary).toBe(colors.accent);
            expect(colors.secondary).toBe(colors.accent);
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
