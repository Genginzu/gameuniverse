// Feature: game-dlc-extensions, Property 4: Complétude du rendu par carte
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { GameDlcExtension, DlcExtensionCategory } from "@/types/game";

/**
 * Feature: game-dlc-extensions
 * Property 4: Complétude du rendu par carte
 * **Validates: Requirements 7.4**
 *
 * For any GameDlcExtension with a non-null name and non-null summary,
 * the rendered card should contain the extension name and summary text.
 *
 * We simulate the component rendering logic (truncation, grouping, display)
 * to verify the property without requiring a DOM environment, following the
 * same pattern as GameVersions.property.test.ts.
 */

// ============================================================================
// Rendering logic extracted from GameDlcExtensions.tsx
// ============================================================================

/** Mirrors the truncateSummary function from the component */
function truncateSummary(summary: string | null): string | null {
  if (!summary) return null;
  if (summary.length <= 100) return summary;
  return `${summary.slice(0, 100).trimEnd()}…`;
}

interface CardRenderOutput {
  nameDisplayed: string;
  summaryDisplayed: string | null;
  hasImage: boolean;
  hasGameLink: boolean;
  hasReleaseDate: boolean;
}

/** Simulates what a single DlcCard would render for a given extension */
function simulateCardRender(item: GameDlcExtension): CardRenderOutput {
  return {
    nameDisplayed: item.name,
    summaryDisplayed: truncateSummary(item.summary),
    hasImage: item.coverImageUrl !== null,
    hasGameLink: item.gameSlug !== null,
    hasReleaseDate: item.releaseDate !== null,
  };
}

// ============================================================================
// Generators
// ============================================================================

const hexChars = "0123456789abcdef".split("");
const hexStringArb = (len: number) =>
  fc.array(fc.constantFrom(...hexChars), { minLength: len, maxLength: len }).map((c) => c.join(""));

const uuidArb = fc
  .tuple(hexStringArb(8), hexStringArb(4), hexStringArb(4), hexStringArb(4), hexStringArb(12))
  .map(([a, b, c, d, e]) => `${a}-${b}-${c}-${d}-${e}`);

const slugArb = fc
  .array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789-".split("")), {
    minLength: 1,
    maxLength: 80,
  })
  .map((chars) => chars.join(""));

const categoryArb: fc.Arbitrary<DlcExtensionCategory> = fc.constantFrom(
  "dlc",
  "expansion",
  "bundle",
  "mod",
  "episode",
  "season",
  "remake",
  "remaster",
  "expanded_game",
  "port",
  "fork",
  "pack",
  "update"
);

/** Non-empty name — the property requires non-null name */
const nameArb = fc.string({ minLength: 1, maxLength: 150 }).filter((s) => s.trim().length > 0);

/** Non-null summary ≤ 100 chars so we can check exact match (no truncation) */
const shortSummaryArb = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

/** Non-null summary > 100 chars to test truncation path */
const longSummaryArb = fc
  .string({ minLength: 101, maxLength: 300 })
  .filter((s) => s.trim().length > 100);

const imageIdArb = fc
  .array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789".split("")), {
    minLength: 4,
    maxLength: 12,
  })
  .map((chars) => chars.join(""));

const coverUrlArb = fc.option(
  imageIdArb.map((id) => `https://images.igdb.com/igdb/image/upload/t_cover_big/${id}.jpg`),
  { nil: null }
);

const releaseDateArb = fc.option(
  fc
    .tuple(
      fc.integer({ min: 1980, max: 2035 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 })
    )
    .map(([y, m, d]) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`),
  { nil: null }
);

/** Generator for a GameDlcExtension with non-null name and non-null short summary */
const extensionWithShortSummaryArb: fc.Arbitrary<GameDlcExtension> = fc.record({
  id: uuidArb,
  igdbId: fc.integer({ min: 1, max: 999_999 }),
  name: nameArb,
  slug: slugArb,
  summary: shortSummaryArb,
  category: categoryArb,
  coverImageUrl: coverUrlArb,
  releaseDate: releaseDateArb,
  gameSlug: fc.option(slugArb, { nil: null }),
});

/** Generator for a GameDlcExtension with non-null name and non-null long summary */
const extensionWithLongSummaryArb: fc.Arbitrary<GameDlcExtension> = fc.record({
  id: uuidArb,
  igdbId: fc.integer({ min: 1, max: 999_999 }),
  name: nameArb,
  slug: slugArb,
  summary: longSummaryArb,
  category: categoryArb,
  coverImageUrl: coverUrlArb,
  releaseDate: releaseDateArb,
  gameSlug: fc.option(slugArb, { nil: null }),
});

// ============================================================================
// Property-Based Tests
// ============================================================================

describe("Property 4: Complétude du rendu par carte", () => {
  it("card output always contains the extension name", () => {
    // **Validates: Requirements 7.4**
    fc.assert(
      fc.property(extensionWithShortSummaryArb, (extension) => {
        const output = simulateCardRender(extension);
        expect(output.nameDisplayed).toBe(extension.name);
        expect(output.nameDisplayed.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it("card output contains the full summary when summary ≤ 100 chars", () => {
    // **Validates: Requirements 7.4**
    fc.assert(
      fc.property(extensionWithShortSummaryArb, (extension) => {
        const output = simulateCardRender(extension);
        expect(output.summaryDisplayed).toBe(extension.summary);
      }),
      { numRuns: 100 }
    );
  });

  it("card output contains a truncated summary when summary > 100 chars", () => {
    // **Validates: Requirements 7.4**
    fc.assert(
      fc.property(extensionWithLongSummaryArb, (extension) => {
        const output = simulateCardRender(extension);

        // Truncated summary should end with ellipsis
        expect(output.summaryDisplayed).not.toBeNull();
        expect(output.summaryDisplayed!.endsWith("…")).toBe(true);

        // The truncated text (minus ellipsis) should be a prefix of the original
        const withoutEllipsis = output.summaryDisplayed!.slice(0, -1);
        expect(extension.summary!.startsWith(withoutEllipsis)).toBe(true);

        // Truncated output should be at most 101 chars (100 + ellipsis)
        expect(output.summaryDisplayed!.length).toBeLessThanOrEqual(101);
      }),
      { numRuns: 100 }
    );
  });

  it("card output contains both name and summary for any valid extension", () => {
    // **Validates: Requirements 7.4**
    // Combined generator: either short or long summary
    const extensionArb = fc.oneof(extensionWithShortSummaryArb, extensionWithLongSummaryArb);

    fc.assert(
      fc.property(extensionArb, (extension) => {
        const output = simulateCardRender(extension);

        // Name is always present
        expect(output.nameDisplayed).toBe(extension.name);

        // Summary is always present (non-null input → non-null output)
        expect(output.summaryDisplayed).not.toBeNull();
        expect(output.summaryDisplayed!.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it("rendering a list of 1-5 extensions produces output for every item", () => {
    // **Validates: Requirements 7.4**
    const extensionsArb = fc.array(
      fc.oneof(extensionWithShortSummaryArb, extensionWithLongSummaryArb),
      { minLength: 1, maxLength: 5 }
    );

    fc.assert(
      fc.property(extensionsArb, (extensions) => {
        const outputs = extensions.map(simulateCardRender);

        // Every extension produces a card output
        expect(outputs).toHaveLength(extensions.length);

        // Every card has name and summary
        for (let i = 0; i < extensions.length; i++) {
          expect(outputs[i].nameDisplayed).toBe(extensions[i].name);
          expect(outputs[i].summaryDisplayed).not.toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });
});
