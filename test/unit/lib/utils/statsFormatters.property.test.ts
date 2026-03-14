import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { getLocalizedMonthLabel, formatLocalizedNumber } from "@/lib/utils/statsFormatters";

// --- Shared generators ---

const monthGen = fc.integer({ min: 1, max: 12 });
const yearGen = fc.integer({ min: 2000, max: 2035 });
const localeGen = fc.constantFrom("fr", "en");

/**
 * Feature: player-stats-dashboard, Property 7: Month labels match locale
 *
 * For any month (1-12) and locale ("fr" or "en"), the label from
 * `getLocalizedMonthLabel` matches `Intl.DateTimeFormat` output.
 *
 * **Validates: Requirements 6.4, 10.4**
 */
describe("Property 7: Month labels match locale", () => {
  // Feature: player-stats-dashboard, Property 7: Month labels match locale
  it("produces labels matching Intl.DateTimeFormat for any month and locale", () => {
    fc.assert(
      fc.property(monthGen, yearGen, localeGen, (month, year, locale) => {
        const result = getLocalizedMonthLabel(month, year, locale);

        const expectedDate = new Date(year, month - 1, 1);
        const expected = new Intl.DateTimeFormat(locale, {
          month: "long",
        }).format(expectedDate);

        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: player-stats-dashboard, Property 12: Number formatting respects locale
 *
 * For any number and locale ("fr" or "en"), the formatted string uses
 * locale-appropriate decimal separator ("," for fr, "." for en).
 *
 * **Validates: Requirements 10.3**
 */
describe("Property 12: Number formatting respects locale", () => {
  // Feature: player-stats-dashboard, Property 12: Number formatting respects locale
  it("uses locale-appropriate decimal separator", () => {
    // Use doubles with fractional parts to ensure a decimal separator appears
    const numberWithDecimalsGen = fc.double({
      min: 0.01,
      max: 1_000_000,
      noNaN: true,
      noDefaultInfinity: true,
    });

    fc.assert(
      fc.property(numberWithDecimalsGen, localeGen, (value, locale) => {
        const result = formatLocalizedNumber(value, locale);

        // The result should match Intl.NumberFormat output exactly
        const expected = new Intl.NumberFormat(locale).format(value);
        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it("formats integers correctly per locale", () => {
    const integerGen = fc.integer({ min: 0, max: 10_000_000 });

    fc.assert(
      fc.property(integerGen, localeGen, (value, locale) => {
        const result = formatLocalizedNumber(value, locale);
        const expected = new Intl.NumberFormat(locale).format(value);
        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });
});
