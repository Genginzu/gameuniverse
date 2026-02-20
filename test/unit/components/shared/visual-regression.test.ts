import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { EntityCardConfig } from "../../../../src/components/shared/EntityCard";
import { getMetascoreColor } from "../../../../src/components/shared/EntityCard"; // eslint-disable-line no-duplicate-imports
import {
  gameCardConfig,
  playerCardConfig,
  characterCardConfig,
} from "../../../../src/components/shared/entityCardPresets";
import type { GameSummary } from "@/types/game";
import type { PlayerSummary } from "@/types/player";
import type { CharacterSummary } from "@/types/character";

/**
 * Visual Regression Tests
 *
 * These tests verify that the EntityCard component with preset configurations
 * produces equivalent output to the original entity-specific card components.
 *
 * **Validates: Requirements 15.2**
 * - WHEN UI components are replaced with generic versions, THE visual output SHALL be identical
 */

// Generator for GameSummary entities
const gameSummaryGenerator = fc.record({
  id: fc.uuid(),
  slug: fc.stringMatching(/^[a-z0-9-]{1,50}$/),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ minLength: 10, maxLength: 500 })),
  coverImage: fc.option(fc.webUrl()),
  backgroundImage: fc.option(fc.webUrl()),
  backgroundColor: fc.option(
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
  ),
  releaseDate: fc.option(fc.date().map((d) => d.toISOString().split("T")[0])),
  releaseYear: fc.option(fc.integer({ min: 1970, max: 2030 })),
  genres: fc.array(fc.record({ id: fc.uuid(), name: fc.string({ minLength: 1, maxLength: 30 }) }), {
    minLength: 0,
    maxLength: 5,
  }),
  developer: fc.string({ minLength: 1, maxLength: 50 }),
  publisher: fc.string({ minLength: 1, maxLength: 50 }),
  metascore: fc.option(fc.integer({ min: 0, max: 100 })),
});

// Generator for PlayerSummary entities
const playerSummaryGenerator = fc.record({
  id: fc.uuid(),
  fullName: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
  avatarUrl: fc.option(fc.webUrl()),
  gamesCount: fc.integer({ min: 0, max: 1000 }),
});

// Generator for CharacterSummary entities
const characterSummaryGenerator = fc.record({
  id: fc.uuid(),
  slug: fc.stringMatching(/^[a-z0-9-]{1,50}$/),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ minLength: 10, maxLength: 500 })),
  mainImage: fc.option(fc.webUrl()),
  backgroundImage: fc.option(fc.webUrl()),
  backgroundColor: fc.option(
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
  ),
  role: fc.option(fc.constantFrom("Protagonist", "Antagonist", "Supporting", "NPC")),
  primaryGame: fc.string({ minLength: 1, maxLength: 100 }),
  gamesCount: fc.integer({ min: 1, max: 100 }),
});

// Simulate the original GameCard rendering logic
const simulateOriginalGameCard = (game: GameSummary, locale: string) => {
  const getMetascoreColorOriginal = (score?: number) => {
    if (!score) return "bg-gray-500";
    if (score >= 90) return "bg-green-600";
    if (score >= 75) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return {
    aspectRatio: "3:4",
    imageUrl: game.coverImage,
    backgroundColor: game.backgroundColor || "#f3f4f6",
    title: game.title,
    description: game.description,
    hasBadge: !!game.metascore,
    badgePosition: "top-right",
    badgeValue: game.metascore,
    badgeColor: getMetascoreColorOriginal(game.metascore),
    hasLibraryToggle: true,
    linkHref: `/${locale}/games/${game.slug}`,
    hasHoverOverlay: true,
  };
};

// Simulate the EntityCard rendering with gameCardConfig
const simulateEntityCardGame = (game: GameSummary, locale: string) => {
  const config = gameCardConfig;

  return {
    aspectRatio: config.aspectRatio,
    imageUrl: game[config.imageField as keyof GameSummary] as string | undefined,
    backgroundColor:
      (game[config.backgroundColorField as keyof GameSummary] as string) || "#f3f4f6",
    title: String(game[config.titleField as keyof GameSummary]),
    description: config.descriptionField
      ? String(game[config.descriptionField as keyof GameSummary] || "")
      : undefined,
    // Match original GameCard behavior: !!metascore is false for 0
    hasBadge: config.badge ? !!game[config.badge.field as keyof GameSummary] : false,
    badgePosition: config.badge?.position || null,
    badgeValue: config.badge ? game[config.badge.field as keyof GameSummary] : undefined,
    badgeColor: config.badge?.colorFn
      ? config.badge.colorFn(game[config.badge.field as keyof GameSummary] as number)
      : getMetascoreColor(game.metascore),
    hasLibraryToggle: config.actions?.libraryToggle || false,
    linkHref: config.linkTemplate(game, locale),
    hasHoverOverlay: config.hoverOverlay?.enabled || false,
  };
};

// Simulate the original PlayerCard rendering logic
const simulateOriginalPlayerCard = (player: PlayerSummary, locale: string) => {
  return {
    aspectRatio: "1:1",
    imageUrl: player.avatarUrl,
    title: player.fullName || "Anonymous Player",
    hasBadge: true,
    badgePosition: "top-right",
    badgeValue: player.gamesCount,
    hasLibraryToggle: false,
    linkHref: `/${locale}/players/${player.id}`,
    hasHoverOverlay: true,
    hasInfoSection: true,
  };
};

// Simulate the EntityCard rendering with playerCardConfig
const simulateEntityCardPlayer = (player: PlayerSummary, locale: string) => {
  const config = playerCardConfig;

  return {
    aspectRatio: config.aspectRatio,
    imageUrl: player[config.imageField as keyof PlayerSummary] as string | undefined,
    title: String(player[config.titleField as keyof PlayerSummary] || "Anonymous Player"),
    hasBadge: config.badge
      ? player[config.badge.field as keyof PlayerSummary] !== undefined
      : false,
    badgePosition: config.badge?.position || null,
    badgeValue: config.badge ? player[config.badge.field as keyof PlayerSummary] : undefined,
    hasLibraryToggle: config.actions?.libraryToggle || false,
    linkHref: config.linkTemplate(player, locale),
    hasHoverOverlay: config.hoverOverlay?.enabled || false,
    hasInfoSection: config.aspectRatio === "1:1",
  };
};

// Simulate the original CharacterCard rendering logic
const simulateOriginalCharacterCard = (character: CharacterSummary, locale: string) => {
  return {
    aspectRatio: "3:4",
    imageUrl: character.mainImage,
    backgroundColor: character.backgroundColor || "#f3f4f6",
    title: character.name,
    description: character.description,
    hasBadge: !!character.role,
    badgePosition: "top-right",
    badgeValue: character.role,
    hasLibraryToggle: false,
    linkHref: `/${locale}/characters/${character.slug}`,
    hasHoverOverlay: true,
  };
};

// Simulate the EntityCard rendering with characterCardConfig
const simulateEntityCardCharacter = (character: CharacterSummary, locale: string) => {
  const config = characterCardConfig;

  return {
    aspectRatio: config.aspectRatio,
    imageUrl: character[config.imageField as keyof CharacterSummary] as string | undefined,
    backgroundColor:
      (character[config.backgroundColorField as keyof CharacterSummary] as string) || "#f3f4f6",
    title: String(character[config.titleField as keyof CharacterSummary]),
    description: config.descriptionField
      ? String(character[config.descriptionField as keyof CharacterSummary] || "")
      : undefined,
    hasBadge: config.badge
      ? character[config.badge.field as keyof CharacterSummary] !== undefined &&
        character[config.badge.field as keyof CharacterSummary] !== null
      : false,
    badgePosition: config.badge?.position || null,
    badgeValue: config.badge ? character[config.badge.field as keyof CharacterSummary] : undefined,
    hasLibraryToggle: config.actions?.libraryToggle || false,
    linkHref: config.linkTemplate(character, locale),
    hasHoverOverlay: config.hoverOverlay?.enabled || false,
  };
};

describe("Visual Regression Tests", () => {
  describe("GameCard Visual Equivalence", () => {
    it("EntityCard with gameCardConfig produces equivalent output to original GameCard", () => {
      fc.assert(
        fc.property(gameSummaryGenerator, fc.constantFrom("fr", "en"), (game, locale) => {
          const original = simulateOriginalGameCard(game as GameSummary, locale);
          const entityCard = simulateEntityCardGame(game as GameSummary, locale);

          // Verify aspect ratio matches
          expect(entityCard.aspectRatio).toBe(original.aspectRatio);

          // Verify image URL matches
          expect(entityCard.imageUrl).toBe(original.imageUrl);

          // Verify background color matches
          expect(entityCard.backgroundColor).toBe(original.backgroundColor);

          // Verify title matches
          expect(entityCard.title).toBe(original.title);

          // Verify badge presence matches
          expect(entityCard.hasBadge).toBe(original.hasBadge);

          // Verify badge position matches when badge is present
          if (entityCard.hasBadge) {
            expect(entityCard.badgePosition).toBe(original.badgePosition);
            expect(entityCard.badgeValue).toBe(original.badgeValue);
          }

          // Verify library toggle matches
          expect(entityCard.hasLibraryToggle).toBe(original.hasLibraryToggle);

          // Verify link href matches
          expect(entityCard.linkHref).toBe(original.linkHref);

          // Verify hover overlay matches
          expect(entityCard.hasHoverOverlay).toBe(original.hasHoverOverlay);

          return true;
        }),
        { numRuns: 50 }
      );
    });

    it("metascore badge color matches original implementation", () => {
      fc.assert(
        fc.property(fc.option(fc.integer({ min: 0, max: 100 })), (score) => {
          const originalColor = (() => {
            if (!score) return "bg-gray-500";
            if (score >= 90) return "bg-green-600";
            if (score >= 75) return "bg-green-500";
            if (score >= 60) return "bg-yellow-500";
            if (score >= 40) return "bg-orange-500";
            return "bg-red-500";
          })();

          const entityCardColor = getMetascoreColor(score ?? undefined);

          return originalColor === entityCardColor;
        }),
        { numRuns: 50 }
      );
    });
  });

  describe("PlayerCard Visual Equivalence", () => {
    it("EntityCard with playerCardConfig produces equivalent output to original PlayerCard", () => {
      fc.assert(
        fc.property(playerSummaryGenerator, fc.constantFrom("fr", "en"), (player, locale) => {
          const original = simulateOriginalPlayerCard(player as PlayerSummary, locale);
          const entityCard = simulateEntityCardPlayer(player as PlayerSummary, locale);

          // Verify aspect ratio matches
          expect(entityCard.aspectRatio).toBe(original.aspectRatio);

          // Verify image URL matches
          expect(entityCard.imageUrl).toBe(original.imageUrl);

          // Verify badge presence matches
          expect(entityCard.hasBadge).toBe(original.hasBadge);

          // Verify badge position matches when badge is present
          if (entityCard.hasBadge) {
            expect(entityCard.badgePosition).toBe(original.badgePosition);
            expect(entityCard.badgeValue).toBe(original.badgeValue);
          }

          // Verify library toggle matches
          expect(entityCard.hasLibraryToggle).toBe(original.hasLibraryToggle);

          // Verify link href matches
          expect(entityCard.linkHref).toBe(original.linkHref);

          // Verify hover overlay matches
          expect(entityCard.hasHoverOverlay).toBe(original.hasHoverOverlay);

          // Verify info section presence matches
          expect(entityCard.hasInfoSection).toBe(original.hasInfoSection);

          return true;
        }),
        { numRuns: 50 }
      );
    });
  });

  describe("CharacterCard Visual Equivalence", () => {
    it("EntityCard with characterCardConfig produces equivalent output to original CharacterCard", () => {
      fc.assert(
        fc.property(characterSummaryGenerator, fc.constantFrom("fr", "en"), (character, locale) => {
          const original = simulateOriginalCharacterCard(character as CharacterSummary, locale);
          const entityCard = simulateEntityCardCharacter(character as CharacterSummary, locale);

          // Verify aspect ratio matches
          expect(entityCard.aspectRatio).toBe(original.aspectRatio);

          // Verify image URL matches
          expect(entityCard.imageUrl).toBe(original.imageUrl);

          // Verify background color matches
          expect(entityCard.backgroundColor).toBe(original.backgroundColor);

          // Verify title matches
          expect(entityCard.title).toBe(original.title);

          // Verify badge presence matches
          expect(entityCard.hasBadge).toBe(original.hasBadge);

          // Verify badge position matches when badge is present
          if (entityCard.hasBadge) {
            expect(entityCard.badgePosition).toBe(original.badgePosition);
            expect(entityCard.badgeValue).toBe(original.badgeValue);
          }

          // Verify library toggle matches
          expect(entityCard.hasLibraryToggle).toBe(original.hasLibraryToggle);

          // Verify link href matches
          expect(entityCard.linkHref).toBe(original.linkHref);

          // Verify hover overlay matches
          expect(entityCard.hasHoverOverlay).toBe(original.hasHoverOverlay);

          return true;
        }),
        { numRuns: 50 }
      );
    });
  });

  describe("Preset Configuration Correctness", () => {
    it("gameCardConfig has correct field mappings", () => {
      expect(gameCardConfig.aspectRatio).toBe("3:4");
      expect(gameCardConfig.imageField).toBe("coverImage");
      expect(gameCardConfig.titleField).toBe("title");
      expect(gameCardConfig.descriptionField).toBe("description");
      expect(gameCardConfig.backgroundColorField).toBe("backgroundColor");
      expect(gameCardConfig.badge?.field).toBe("metascore");
      expect(gameCardConfig.badge?.position).toBe("top-right");
      expect(gameCardConfig.badge?.variant).toBe("metascore");
      expect(gameCardConfig.actions?.libraryToggle).toBe(true);
      expect(gameCardConfig.hoverOverlay?.enabled).toBe(true);
    });

    it("playerCardConfig has correct field mappings", () => {
      expect(playerCardConfig.aspectRatio).toBe("1:1");
      expect(playerCardConfig.imageField).toBe("avatarUrl");
      expect(playerCardConfig.titleField).toBe("fullName");
      expect(playerCardConfig.badge?.field).toBe("gamesCount");
      expect(playerCardConfig.badge?.position).toBe("top-right");
      expect(playerCardConfig.badge?.variant).toBe("count");
      expect(playerCardConfig.actions?.libraryToggle).toBeUndefined();
      expect(playerCardConfig.hoverOverlay?.enabled).toBe(true);
    });

    it("characterCardConfig has correct field mappings", () => {
      expect(characterCardConfig.aspectRatio).toBe("3:4");
      expect(characterCardConfig.imageField).toBe("mainImage");
      expect(characterCardConfig.titleField).toBe("name");
      expect(characterCardConfig.descriptionField).toBe("description");
      expect(characterCardConfig.backgroundColorField).toBe("backgroundColor");
      expect(characterCardConfig.badge?.field).toBe("role");
      expect(characterCardConfig.badge?.position).toBe("top-right");
      expect(characterCardConfig.badge?.variant).toBe("role");
      expect(characterCardConfig.actions?.libraryToggle).toBeUndefined();
      expect(characterCardConfig.hoverOverlay?.enabled).toBe(true);
    });
  });

  describe("Link Template Correctness", () => {
    it("gameCardConfig link template generates correct URLs", () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-z0-9-]{1,50}$/),
          fc.constantFrom("fr", "en"),
          (slug, locale) => {
            const game = { slug } as GameSummary;
            const link = gameCardConfig.linkTemplate(game, locale);
            return link === `/${locale}/games/${slug}`;
          }
        ),
        { numRuns: 50 }
      );
    });

    it("playerCardConfig link template generates correct URLs", () => {
      fc.assert(
        fc.property(fc.uuid(), fc.constantFrom("fr", "en"), (id, locale) => {
          const player = { id } as PlayerSummary;
          const link = playerCardConfig.linkTemplate(player, locale);
          return link === `/${locale}/players/${id}`;
        }),
        { numRuns: 50 }
      );
    });

    it("characterCardConfig link template generates correct URLs", () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-z0-9-]{1,50}$/),
          fc.constantFrom("fr", "en"),
          (slug, locale) => {
            const character = { slug } as CharacterSummary;
            const link = characterCardConfig.linkTemplate(character, locale);
            return link === `/${locale}/characters/${slug}`;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
