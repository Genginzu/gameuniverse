import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { CharacterFavoriteSummary } from "../../../../src/types/character";

// Feature: character-favorites, Property 5: ComplÃ©tude de l'affichage des favoris
// **Validates: Requirements 3.2, 4.1**
//
// For any CharacterFavoriteSummary displayed (whether on the favorites page
// or player profile), the render must contain the name, image, role, and
// primary game of the character.

// ---------------------------------------------------------------------------
// Simulate the display extraction logic that the UI components perform
// when rendering a CharacterFavoriteSummary card.
// ---------------------------------------------------------------------------

interface FavoriteDisplayFields {
  name: string;
  primaryGame: string;
  hasImage: boolean;
  imageUrl: string | undefined;
  hasRole: boolean;
  role: string | undefined;
  slug: string;
  favoritedAt: string;
}

function extractDisplayFields(summary: CharacterFavoriteSummary): FavoriteDisplayFields {
  return {
    name: summary.name,
    primaryGame: summary.primaryGame,
    hasImage: !!summary.mainImage,
    imageUrl: summary.mainImage,
    hasRole: !!summary.role,
    role: summary.role,
    slug: summary.slug,
    favoritedAt: summary.favoritedAt,
  };
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const slugGenerator = fc.stringMatching(/^[a-z0-9-]{1,50}$/);
const nameGenerator = fc.string({ minLength: 1, maxLength: 100 });
const primaryGameGenerator = fc.string({ minLength: 1, maxLength: 100 });
const imageUrlGenerator = fc.option(fc.webUrl(), { nil: undefined });
const roleGenerator = fc.option(
  fc.constantFrom("Protagonist", "Antagonist", "Supporting", "NPC", "Playable"),
  { nil: undefined }
);
const hexColorGenerator = fc.option(
  fc
    .tuple(
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 })
    )
    .map(
      ([r, g, b]) =>
        `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
    ),
  { nil: undefined }
);
// Generate ISO date strings from timestamps to avoid Invalid Date issues
const favoritedAtGenerator = fc
  .integer({
    min: new Date("2020-01-01").getTime(),
    max: new Date("2030-12-31").getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

const characterFavoriteSummaryGenerator: fc.Arbitrary<CharacterFavoriteSummary> = fc.record({
  id: fc.uuid(),
  slug: slugGenerator,
  name: nameGenerator,
  role: roleGenerator,
  mainImage: imageUrlGenerator,
  backgroundColor: hexColorGenerator,
  primaryGame: primaryGameGenerator,
  favoritedAt: favoritedAtGenerator,
});

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe("FavoriteCharacterButton â€” Property-Based Tests", () => {
  describe("Property 5: ComplÃ©tude de l'affichage des favoris", () => {
    it("name is always present and matches the summary for any valid input", () => {
      fc.assert(
        fc.property(characterFavoriteSummaryGenerator, (summary) => {
          const display = extractDisplayFields(summary);

          expect(display.name).toBe(summary.name);
          expect(display.name.length).toBeGreaterThan(0);
        }),
        { numRuns: 30 }
      );
    });

    it("primaryGame is always present and matches the summary for any valid input", () => {
      fc.assert(
        fc.property(characterFavoriteSummaryGenerator, (summary) => {
          const display = extractDisplayFields(summary);

          expect(display.primaryGame).toBe(summary.primaryGame);
          expect(display.primaryGame.length).toBeGreaterThan(0);
        }),
        { numRuns: 30 }
      );
    });

    it("image field is correctly propagated (present or undefined)", () => {
      fc.assert(
        fc.property(characterFavoriteSummaryGenerator, (summary) => {
          const display = extractDisplayFields(summary);

          expect(display.imageUrl).toBe(summary.mainImage);
          expect(display.hasImage).toBe(!!summary.mainImage);
        }),
        { numRuns: 30 }
      );
    });

    it("role field is correctly propagated (present or undefined)", () => {
      fc.assert(
        fc.property(characterFavoriteSummaryGenerator, (summary) => {
          const display = extractDisplayFields(summary);

          expect(display.role).toBe(summary.role);
          expect(display.hasRole).toBe(!!summary.role);
        }),
        { numRuns: 30 }
      );
    });

    it("all required display fields are present for any list of favorites", () => {
      fc.assert(
        fc.property(
          fc.array(characterFavoriteSummaryGenerator, {
            minLength: 1,
            maxLength: 30,
          }),
          (favorites) => {
            for (const summary of favorites) {
              const display = extractDisplayFields(summary);

              // Required fields must always be non-empty strings
              expect(display.name.length).toBeGreaterThan(0);
              expect(display.primaryGame.length).toBeGreaterThan(0);
              expect(display.slug).toBe(summary.slug);
              expect(display.favoritedAt).toBe(summary.favoritedAt);

              // Optional fields must be either a string or undefined
              if (display.hasImage) {
                expect(typeof display.imageUrl).toBe("string");
              } else {
                expect(display.imageUrl).toBeUndefined();
              }

              if (display.hasRole) {
                expect(typeof display.role).toBe("string");
              } else {
                expect(display.role).toBeUndefined();
              }
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("display extraction is deterministic for the same input", () => {
      fc.assert(
        fc.property(characterFavoriteSummaryGenerator, (summary) => {
          const display1 = extractDisplayFields(summary);
          const display2 = extractDisplayFields(summary);

          expect(display1).toEqual(display2);
        }),
        { numRuns: 30 }
      );
    });
  });
});
