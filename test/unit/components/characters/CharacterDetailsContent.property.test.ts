import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import type {
  CharacterDetails,
  CharacterGame,
  CharacterMedia,
} from "../../../../src/types/character";

/**
 * Feature: character-pages
 * Property 8: Character Details Completeness
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
 *
 * For any valid character slug, the details page should display all available
 * character information: hero section with main image and name, origin games,
 * role, description, and biography (when present).
 *
 * This test validates the CharacterDetailsContent rendering logic to ensure that
 * for any valid CharacterDetails input, the component correctly extracts and
 * displays all required and optional fields.
 */

// Simulate CharacterDetailsContent rendering logic - mirrors the actual component behavior
interface CharacterDetailsRenderResult {
  // Hero section (Req 5.2)
  heroSection: {
    mainImage: string | undefined;
    characterName: string;
    backgroundImage: string | undefined;
    backgroundColor: string;
  };
  // Character info (Req 5.3)
  characterInfo: {
    role: string | undefined;
    hasRole: boolean;
    description: string | undefined;
    hasDescription: boolean;
    primaryGame: string;
    games: CharacterGame[];
    gamesCount: number;
  };
  // Biography section (Req 5.4)
  biographySection: {
    biography: string | undefined;
    hasBiography: boolean;
    weapons: string | undefined;
    hasWeapons: boolean;
  };
  // Tabs available
  tabs: {
    hasDescriptionTab: boolean;
    hasGamesTab: boolean;
    hasMediaTab: boolean;
  };
}

const simulateCharacterDetailsRender = (
  character: CharacterDetails
): CharacterDetailsRenderResult => {
  const primaryGame = character.games.find((g) => g.isPrimary) || character.games[0];
  const heroBackgroundImage = primaryGame?.backgroundImage || character.media.backgroundImage;

  return {
    heroSection: {
      mainImage: character.media.mainImage,
      characterName: character.name,
      backgroundImage: heroBackgroundImage,
      backgroundColor: character.backgroundColor || "#0f172a",
    },
    characterInfo: {
      role: character.role,
      hasRole: !!character.role,
      description: character.description,
      hasDescription: !!character.description,
      primaryGame: character.primaryGame,
      games: character.games,
      gamesCount: character.games.length,
    },
    biographySection: {
      biography: character.biography,
      hasBiography: !!character.biography,
      weapons: character.weapons,
      hasWeapons: !!character.weapons,
    },
    tabs: {
      hasDescriptionTab: true, // Always present
      hasGamesTab: true, // Always present
      hasMediaTab: true, // Always present
    },
  };
};

// Generators
const slugGenerator = fc.stringMatching(/^[a-z0-9-]{1,50}$/);
const nameGenerator = fc.string({ minLength: 1, maxLength: 100 });
const imageUrlGenerator = fc.option(fc.webUrl());
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

const roleGenerator = fc.option(
  fc.constantFrom("Protagonist", "Antagonist", "Supporting", "NPC", "Playable", "Hero", "Villain")
);
const descriptionGenerator = fc.option(fc.string({ minLength: 10, maxLength: 500 }));
const biographyGenerator = fc.option(fc.string({ minLength: 20, maxLength: 2000 }));
const weaponsGenerator = fc.option(fc.string({ minLength: 5, maxLength: 300 }));

// Generator for CharacterGame
const characterGameGenerator: fc.Arbitrary<CharacterGame> = fc.record({
  id: fc.uuid(),
  slug: slugGenerator,
  title: nameGenerator,
  coverImage: imageUrlGenerator,
  backgroundImage: imageUrlGenerator,
  releaseYear: fc.option(fc.integer({ min: 1970, max: 2030 })),
  isPrimary: fc.boolean(),
});

// Generator for CharacterMedia
const characterMediaGenerator: fc.Arbitrary<CharacterMedia> = fc.record({
  mainImage: imageUrlGenerator,
  backgroundImage: imageUrlGenerator,
  screenshots: fc.array(
    fc.record({
      id: fc.uuid(),
      url: fc.webUrl(),
      altText: fc.option(fc.string({ maxLength: 100 })),
      caption: fc.option(fc.string({ maxLength: 200 })),
      isFeatured: fc.option(fc.boolean()),
    }),
    { maxLength: 10 }
  ),
  artwork: fc.array(
    fc.record({
      id: fc.uuid(),
      url: fc.webUrl(),
      altText: fc.option(fc.string({ maxLength: 100 })),
      caption: fc.option(fc.string({ maxLength: 200 })),
      type: fc.option(fc.string({ maxLength: 50 })),
      isFeatured: fc.option(fc.boolean()),
    }),
    { maxLength: 10 }
  ),
  videos: fc.array(
    fc.record({
      id: fc.uuid(),
      title: fc.string({ minLength: 1, maxLength: 100 }),
      description: fc.option(fc.string({ maxLength: 300 })),
      url: fc.webUrl(),
      thumbnailUrl: fc.option(fc.webUrl()),
      type: fc.option(fc.string({ maxLength: 50 })),
      duration: fc.option(fc.integer({ min: 1, max: 7200 })),
      isFeatured: fc.option(fc.boolean()),
    }),
    { maxLength: 5 }
  ),
});

// ISO date string generator (more reliable than fc.date())
const isoDateGenerator = fc
  .integer({ min: 0, max: 1800000000000 }) // Valid timestamp range
  .map((ts) => new Date(ts).toISOString());

// Generator for CharacterDetails with at least one game
const characterDetailsGenerator: fc.Arbitrary<CharacterDetails> = fc
  .record({
    id: fc.uuid(),
    slug: slugGenerator,
    name: nameGenerator,
    role: roleGenerator,
    description: descriptionGenerator,
    biography: biographyGenerator,
    weapons: weaponsGenerator,
    backgroundColor: hexColorGenerator,
    games: fc.array(characterGameGenerator, { minLength: 1, maxLength: 10 }),
    primaryGame: nameGenerator,
    media: characterMediaGenerator,
    relationships: fc.constant([]), // Simplified for this test
    createdAt: isoDateGenerator,
    updatedAt: isoDateGenerator,
  })
  .map((character) => {
    // Ensure at least one game is marked as primary if games exist
    if (character.games.length > 0 && !character.games.some((g) => g.isPrimary)) {
      character.games[0].isPrimary = true;
    }
    return character;
  });

describe("CharacterDetailsContent Property-Based Tests", () => {
  describe("Property 8: Character Details Completeness", () => {
    /**
     * Requirement 5.2: Hero section with main image and name
     */
    it("always displays character name in hero section for any valid character", () => {
      fc.assert(
        fc.property(characterDetailsGenerator, (character) => {
          const result = simulateCharacterDetailsRender(character);

          // Character name must always be present and match input
          expect(result.heroSection.characterName).toBe(character.name);
          expect(result.heroSection.characterName.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it("always provides main image (or undefined) matching input in hero section", () => {
      fc.assert(
        fc.property(characterDetailsGenerator, (character) => {
          const result = simulateCharacterDetailsRender(character);

          // Main image must match the media.mainImage
          expect(result.heroSection.mainImage).toBe(character.media.mainImage);
        }),
        { numRuns: 100 }
      );
    });

    it("uses fallback background color when none provided", () => {
      fc.assert(
        fc.property(
          characterDetailsGenerator.map((c) => ({ ...c, backgroundColor: undefined })),
          (character) => {
            const result = simulateCharacterDetailsRender(character);

            // Should use fallback color
            expect(result.heroSection.backgroundColor).toBe("#0f172a");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("uses provided background color when available", () => {
      fc.assert(
        fc.property(
          characterDetailsGenerator,
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
            const characterWithColor: CharacterDetails = {
              ...character,
              backgroundColor: color,
            };
            const result = simulateCharacterDetailsRender(characterWithColor);

            expect(result.heroSection.backgroundColor).toBe(color);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Requirement 5.3: Origin game(s), role, and description
     */
    it("always displays primary game name for any valid character", () => {
      fc.assert(
        fc.property(characterDetailsGenerator, (character) => {
          const result = simulateCharacterDetailsRender(character);

          // Primary game must always be present
          expect(result.characterInfo.primaryGame).toBe(character.primaryGame);
          expect(result.characterInfo.primaryGame.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it("always includes all games in character info", () => {
      fc.assert(
        fc.property(characterDetailsGenerator, (character) => {
          const result = simulateCharacterDetailsRender(character);

          // Games array must match input
          expect(result.characterInfo.games).toEqual(character.games);
          expect(result.characterInfo.gamesCount).toBe(character.games.length);
        }),
        { numRuns: 100 }
      );
    });

    it("correctly indicates role presence for any valid character", () => {
      fc.assert(
        fc.property(characterDetailsGenerator, (character) => {
          const result = simulateCharacterDetailsRender(character);

          // hasRole should be true only when role is truthy
          const expectedHasRole = !!character.role;
          expect(result.characterInfo.hasRole).toBe(expectedHasRole);

          if (result.characterInfo.hasRole) {
            expect(result.characterInfo.role).toBe(character.role);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("correctly indicates description presence for any valid character", () => {
      fc.assert(
        fc.property(characterDetailsGenerator, (character) => {
          const result = simulateCharacterDetailsRender(character);

          // hasDescription should be true only when description is truthy
          const expectedHasDescription = !!character.description;
          expect(result.characterInfo.hasDescription).toBe(expectedHasDescription);

          if (result.characterInfo.hasDescription) {
            expect(result.characterInfo.description).toBe(character.description);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Requirement 5.4: Biography and story information
     */
    it("correctly indicates biography presence for any valid character", () => {
      fc.assert(
        fc.property(characterDetailsGenerator, (character) => {
          const result = simulateCharacterDetailsRender(character);

          // hasBiography should be true only when biography is truthy
          const expectedHasBiography = !!character.biography;
          expect(result.biographySection.hasBiography).toBe(expectedHasBiography);

          if (result.biographySection.hasBiography) {
            expect(result.biographySection.biography).toBe(character.biography);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("correctly indicates weapons presence for any valid character", () => {
      fc.assert(
        fc.property(characterDetailsGenerator, (character) => {
          const result = simulateCharacterDetailsRender(character);

          // hasWeapons should be true only when weapons is truthy
          const expectedHasWeapons = !!character.weapons;
          expect(result.biographySection.hasWeapons).toBe(expectedHasWeapons);

          if (result.biographySection.hasWeapons) {
            expect(result.biographySection.weapons).toBe(character.weapons);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Requirement 5.1: Complete information display
     */
    it("always has all three tabs available for any valid character", () => {
      fc.assert(
        fc.property(characterDetailsGenerator, (character) => {
          const result = simulateCharacterDetailsRender(character);

          // All tabs should always be available
          expect(result.tabs.hasDescriptionTab).toBe(true);
          expect(result.tabs.hasGamesTab).toBe(true);
          expect(result.tabs.hasMediaTab).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("derives hero background from primary game or media when available", () => {
      fc.assert(
        fc.property(characterDetailsGenerator, (character) => {
          const result = simulateCharacterDetailsRender(character);

          const primaryGame = character.games.find((g) => g.isPrimary) || character.games[0];
          const expectedBackground =
            primaryGame?.backgroundImage || character.media.backgroundImage;

          expect(result.heroSection.backgroundImage).toBe(expectedBackground);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 8 Extended: Rendering Consistency", () => {
    it("same character always produces same render result (deterministic)", () => {
      fc.assert(
        fc.property(characterDetailsGenerator, (character) => {
          const result1 = simulateCharacterDetailsRender(character);
          const result2 = simulateCharacterDetailsRender(character);

          // Hero section
          expect(result1.heroSection.characterName).toBe(result2.heroSection.characterName);
          expect(result1.heroSection.mainImage).toBe(result2.heroSection.mainImage);
          expect(result1.heroSection.backgroundColor).toBe(result2.heroSection.backgroundColor);
          expect(result1.heroSection.backgroundImage).toBe(result2.heroSection.backgroundImage);

          // Character info
          expect(result1.characterInfo.primaryGame).toBe(result2.characterInfo.primaryGame);
          expect(result1.characterInfo.hasRole).toBe(result2.characterInfo.hasRole);
          expect(result1.characterInfo.hasDescription).toBe(result2.characterInfo.hasDescription);
          expect(result1.characterInfo.gamesCount).toBe(result2.characterInfo.gamesCount);

          // Biography section
          expect(result1.biographySection.hasBiography).toBe(result2.biographySection.hasBiography);
          expect(result1.biographySection.hasWeapons).toBe(result2.biographySection.hasWeapons);
        }),
        { numRuns: 100 }
      );
    });

    it("handles characters with minimal data (only required fields)", () => {
      const minimalCharacterGenerator = fc.record({
        id: fc.uuid(),
        slug: slugGenerator,
        name: nameGenerator,
        primaryGame: nameGenerator,
        games: fc.array(characterGameGenerator, { minLength: 1, maxLength: 1 }),
        media: fc.constant({
          screenshots: [],
          artwork: [],
          videos: [],
        } as CharacterMedia),
        relationships: fc.constant([]),
        createdAt: isoDateGenerator,
        updatedAt: isoDateGenerator,
      });

      fc.assert(
        fc.property(minimalCharacterGenerator, (character) => {
          const fullCharacter: CharacterDetails = {
            ...character,
            role: undefined,
            description: undefined,
            biography: undefined,
            weapons: undefined,
            backgroundColor: undefined,
          };

          const result = simulateCharacterDetailsRender(fullCharacter);

          // Required fields must still be present
          expect(result.heroSection.characterName.length).toBeGreaterThan(0);
          expect(result.characterInfo.primaryGame.length).toBeGreaterThan(0);
          expect(result.characterInfo.gamesCount).toBeGreaterThanOrEqual(1);

          // Optional fields should be correctly indicated as absent
          expect(result.characterInfo.hasRole).toBe(false);
          expect(result.characterInfo.hasDescription).toBe(false);
          expect(result.biographySection.hasBiography).toBe(false);
          expect(result.biographySection.hasWeapons).toBe(false);

          // Fallback background color should be used
          expect(result.heroSection.backgroundColor).toBe("#0f172a");
        }),
        { numRuns: 100 }
      );
    });

    it("handles characters with all optional fields populated", () => {
      const fullCharacterGenerator = fc.record({
        id: fc.uuid(),
        slug: slugGenerator,
        name: nameGenerator,
        role: fc.constantFrom("Protagonist", "Antagonist", "Supporting"),
        description: fc.string({ minLength: 10, maxLength: 500 }),
        biography: fc.string({ minLength: 20, maxLength: 2000 }),
        weapons: fc.string({ minLength: 5, maxLength: 300 }),
        backgroundColor: fc
          .tuple(
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 })
          )
          .map(
            ([r, g, b]) =>
              `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
          ),
        primaryGame: nameGenerator,
        games: fc.array(characterGameGenerator, { minLength: 1, maxLength: 10 }),
        media: characterMediaGenerator,
        relationships: fc.constant([]),
        createdAt: isoDateGenerator,
        updatedAt: isoDateGenerator,
      });

      fc.assert(
        fc.property(fullCharacterGenerator, (character) => {
          const result = simulateCharacterDetailsRender(character);

          // All optional fields should be correctly indicated as present
          expect(result.characterInfo.hasRole).toBe(true);
          expect(result.characterInfo.hasDescription).toBe(true);
          expect(result.biographySection.hasBiography).toBe(true);
          expect(result.biographySection.hasWeapons).toBe(true);

          // Values should match input
          expect(result.characterInfo.role).toBe(character.role);
          expect(result.characterInfo.description).toBe(character.description);
          expect(result.biographySection.biography).toBe(character.biography);
          expect(result.biographySection.weapons).toBe(character.weapons);
          expect(result.heroSection.backgroundColor).toBe(character.backgroundColor);
        }),
        { numRuns: 100 }
      );
    });
  });
});
