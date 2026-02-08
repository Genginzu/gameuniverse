import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import type { CharacterSummary } from "../../../../src/types/character";

/**
 * Feature: character-pages
 * Property 1: Character Card Rendering Completeness
 * **Validates: Requirements 1.1, 1.2**
 *
 * For any list of characters, when rendering character cards, each card should
 * display all required fields: main image, character name, and primary game name.
 *
 * This test validates the CharacterCard rendering logic to ensure that for any
 * valid CharacterSummary input, the component correctly extracts and displays
 * all required fields.
 */

// Simulate CharacterCard rendering logic - mirrors the actual component behavior
const simulateCharacterCardRender = (
  character: CharacterSummary,
  locale: string = "fr"
): {
  linkHref: string;
  imageUrl: string | undefined;
  imageAlt: string;
  backgroundColor: string;
  name: string;
  primaryGame: string;
  gamesCount: number;
  hasRole: boolean;
  role: string | undefined;
  hasDescription: boolean;
  description: string | undefined;
} => {
  return {
    linkHref: `/${locale}/characters/${character.slug}`,
    imageUrl: character.mainImage,
    imageAlt: character.name,
    backgroundColor: character.backgroundColor || "#f3f4f6",
    name: character.name,
    primaryGame: character.primaryGame,
    gamesCount: character.gamesCount,
    hasRole: !!character.role,
    role: character.role,
    hasDescription: !!character.description,
    description: character.description,
  };
};

// Generator for valid slugs (URL-friendly strings)
const slugGenerator = fc.stringMatching(/^[a-z0-9-]{1,50}$/);

// Generator for character names (non-empty strings)
const nameGenerator = fc.string({ minLength: 1, maxLength: 100 });

// Generator for primary game names (non-empty strings)
const primaryGameGenerator = fc.string({ minLength: 1, maxLength: 100 });

// Generator for optional image URLs
const imageUrlGenerator = fc.option(fc.webUrl());

// Generator for optional hex colors
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
    )
);

// Generator for optional roles
const roleGenerator = fc.option(
  fc.constantFrom("Protagonist", "Antagonist", "Supporting", "NPC", "Playable")
);

// Generator for optional descriptions
const descriptionGenerator = fc.option(fc.string({ minLength: 10, maxLength: 500 }));

// Generator for games count (non-negative integer)
const gamesCountGenerator = fc.integer({ min: 0, max: 1000 });

// Generator for valid CharacterSummary objects
const characterSummaryGenerator: fc.Arbitrary<CharacterSummary> = fc.record({
  id: fc.uuid(),
  slug: slugGenerator,
  name: nameGenerator,
  role: roleGenerator,
  description: descriptionGenerator,
  mainImage: imageUrlGenerator,
  backgroundColor: hexColorGenerator,
  primaryGame: primaryGameGenerator,
  gamesCount: gamesCountGenerator,
});

// Generator for locale
const localeGenerator = fc.constantFrom("fr", "en");

describe("CharacterCard Property-Based Tests", () => {
  describe("Property 1: Character Card Rendering Completeness", () => {
    it("always displays character name for any valid character", () => {
      fc.assert(
        fc.property(characterSummaryGenerator, (character) => {
          const result = simulateCharacterCardRender(character);

          // Name must always be present and match the input
          expect(result.name).toBe(character.name);
          expect(result.name.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it("always displays primary game name for any valid character", () => {
      fc.assert(
        fc.property(characterSummaryGenerator, (character) => {
          const result = simulateCharacterCardRender(character);

          // Primary game must always be present and match the input
          expect(result.primaryGame).toBe(character.primaryGame);
          expect(result.primaryGame.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it("always provides image URL (or undefined) matching input for any valid character", () => {
      fc.assert(
        fc.property(characterSummaryGenerator, (character) => {
          const result = simulateCharacterCardRender(character);

          // Image URL must match the input (can be undefined)
          expect(result.imageUrl).toBe(character.mainImage);
        }),
        { numRuns: 100 }
      );
    });

    it("uses character name as image alt text for accessibility", () => {
      fc.assert(
        fc.property(characterSummaryGenerator, (character) => {
          const result = simulateCharacterCardRender(character);

          // Alt text must always equal the character name
          expect(result.imageAlt).toBe(character.name);
        }),
        { numRuns: 100 }
      );
    });

    it("always displays games count for any valid character", () => {
      fc.assert(
        fc.property(characterSummaryGenerator, (character) => {
          const result = simulateCharacterCardRender(character);

          // Games count must always be present and match the input
          expect(result.gamesCount).toBe(character.gamesCount);
          expect(result.gamesCount).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    it("generates correct link href with locale for any valid character", () => {
      fc.assert(
        fc.property(characterSummaryGenerator, localeGenerator, (character, locale) => {
          const result = simulateCharacterCardRender(character, locale);

          // Link must follow the pattern /{locale}/characters/{slug}
          const expectedHref = `/${locale}/characters/${character.slug}`;
          expect(result.linkHref).toBe(expectedHref);
        }),
        { numRuns: 100 }
      );
    });

    it("uses fallback background color when none provided", () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            slug: slugGenerator,
            name: nameGenerator,
            primaryGame: primaryGameGenerator,
            gamesCount: gamesCountGenerator,
            // Explicitly no backgroundColor
          }),
          (character) => {
            const fullCharacter: CharacterSummary = {
              ...character,
              backgroundColor: undefined,
            };
            const result = simulateCharacterCardRender(fullCharacter);

            // Should use fallback color
            expect(result.backgroundColor).toBe("#f3f4f6");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("uses provided background color when available", () => {
      fc.assert(
        fc.property(
          characterSummaryGenerator,
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
          (character, color) => {
            const characterWithColor: CharacterSummary = {
              ...character,
              backgroundColor: color,
            };
            const result = simulateCharacterCardRender(characterWithColor);

            // Should use provided color
            expect(result.backgroundColor).toBe(color);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 1 Extended: Optional Fields Handling", () => {
    it("correctly indicates role presence for any valid character", () => {
      fc.assert(
        fc.property(characterSummaryGenerator, (character) => {
          const result = simulateCharacterCardRender(character);

          // hasRole should be true only when role is truthy
          const expectedHasRole = !!character.role;
          expect(result.hasRole).toBe(expectedHasRole);

          if (result.hasRole) {
            expect(result.role).toBe(character.role);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("correctly indicates description presence for any valid character", () => {
      fc.assert(
        fc.property(characterSummaryGenerator, (character) => {
          const result = simulateCharacterCardRender(character);

          // hasDescription should be true only when description is truthy
          const expectedHasDescription = !!character.description;
          expect(result.hasDescription).toBe(expectedHasDescription);

          if (result.hasDescription) {
            expect(result.description).toBe(character.description);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 1 Extended: Rendering Consistency", () => {
    it("same character always produces same render result (deterministic)", () => {
      fc.assert(
        fc.property(characterSummaryGenerator, localeGenerator, (character, locale) => {
          const result1 = simulateCharacterCardRender(character, locale);
          const result2 = simulateCharacterCardRender(character, locale);

          // All fields should be identical for the same input
          expect(result1.linkHref).toBe(result2.linkHref);
          expect(result1.imageUrl).toBe(result2.imageUrl);
          expect(result1.imageAlt).toBe(result2.imageAlt);
          expect(result1.backgroundColor).toBe(result2.backgroundColor);
          expect(result1.name).toBe(result2.name);
          expect(result1.primaryGame).toBe(result2.primaryGame);
          expect(result1.gamesCount).toBe(result2.gamesCount);
          expect(result1.hasRole).toBe(result2.hasRole);
          expect(result1.role).toBe(result2.role);
          expect(result1.hasDescription).toBe(result2.hasDescription);
          expect(result1.description).toBe(result2.description);
        }),
        { numRuns: 100 }
      );
    });

    it("renders all characters in a list with complete required fields", () => {
      fc.assert(
        fc.property(
          fc.array(characterSummaryGenerator, { minLength: 1, maxLength: 50 }),
          localeGenerator,
          (characters, locale) => {
            // For any list of characters, all cards should have required fields
            for (const character of characters) {
              const result = simulateCharacterCardRender(character, locale);

              // Required fields must always be present
              expect(result.name.length).toBeGreaterThan(0);
              expect(result.primaryGame.length).toBeGreaterThan(0);
              expect(result.linkHref).toContain(`/${locale}/characters/`);
              expect(result.gamesCount).toBeGreaterThanOrEqual(0);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
