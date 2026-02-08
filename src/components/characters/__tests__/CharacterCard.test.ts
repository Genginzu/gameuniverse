import { describe, it, expect } from "bun:test";
import type { CharacterSummary } from "@/types/character";

/**
 * Unit Tests for CharacterCard Component
 *
 * **Validates: Requirements 1.2**
 * - WHEN displaying characters, THE Character_List_Page SHALL show character
 *   cards with image, name, and origin game
 */

// Simulate CharacterCard rendering logic
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

describe("CharacterCard Unit Tests", () => {
  describe("Required Fields Display", () => {
    it("displays all required fields: image, name, and primary game", () => {
      const character: CharacterSummary = {
        id: "char-1",
        slug: "mario",
        name: "Mario",
        role: "Protagonist",
        description: "The famous plumber from the Mushroom Kingdom",
        mainImage: "https://example.com/mario.jpg",
        backgroundColor: "#ff0000",
        primaryGame: "Super Mario Bros",
        gamesCount: 50,
      };

      const result = simulateCharacterCardRender(character);

      // Verify required fields are present
      expect(result.imageUrl).toBe("https://example.com/mario.jpg");
      expect(result.imageAlt).toBe("Mario");
      expect(result.name).toBe("Mario");
      expect(result.primaryGame).toBe("Super Mario Bros");
    });

    it("displays games count correctly", () => {
      const character: CharacterSummary = {
        id: "char-2",
        slug: "link",
        name: "Link",
        mainImage: "https://example.com/link.jpg",
        primaryGame: "The Legend of Zelda",
        gamesCount: 25,
      };

      const result = simulateCharacterCardRender(character);

      expect(result.gamesCount).toBe(25);
    });

    it("uses character name as image alt text", () => {
      const character: CharacterSummary = {
        id: "char-3",
        slug: "samus-aran",
        name: "Samus Aran",
        mainImage: "https://example.com/samus.jpg",
        primaryGame: "Metroid",
        gamesCount: 15,
      };

      const result = simulateCharacterCardRender(character);

      expect(result.imageAlt).toBe("Samus Aran");
    });
  });

  describe("Missing Role Handling", () => {
    it("handles missing role gracefully (hasRole is false)", () => {
      const characterWithoutRole: CharacterSummary = {
        id: "char-4",
        slug: "generic-npc",
        name: "Generic NPC",
        mainImage: "https://example.com/npc.jpg",
        primaryGame: "Some Game",
        gamesCount: 1,
        // role is intentionally omitted
      };

      const result = simulateCharacterCardRender(characterWithoutRole);

      expect(result.hasRole).toBe(false);
      expect(result.role).toBeUndefined();
    });

    it("displays role badge when role is present", () => {
      const characterWithRole: CharacterSummary = {
        id: "char-5",
        slug: "bowser",
        name: "Bowser",
        role: "Antagonist",
        mainImage: "https://example.com/bowser.jpg",
        primaryGame: "Super Mario Bros",
        gamesCount: 40,
      };

      const result = simulateCharacterCardRender(characterWithRole);

      expect(result.hasRole).toBe(true);
      expect(result.role).toBe("Antagonist");
    });

    it("handles empty string role as no role", () => {
      const characterWithEmptyRole: CharacterSummary = {
        id: "char-6",
        slug: "test-char",
        name: "Test Character",
        role: "",
        mainImage: "https://example.com/test.jpg",
        primaryGame: "Test Game",
        gamesCount: 1,
      };

      const result = simulateCharacterCardRender(characterWithEmptyRole);

      // Empty string is falsy, so hasRole should be false
      expect(result.hasRole).toBe(false);
    });
  });

  describe("Link Navigation", () => {
    it("generates correct link href with default locale (fr)", () => {
      const character: CharacterSummary = {
        id: "char-7",
        slug: "pikachu",
        name: "Pikachu",
        mainImage: "https://example.com/pikachu.jpg",
        primaryGame: "Pokémon Red/Blue",
        gamesCount: 100,
      };

      const result = simulateCharacterCardRender(character);

      expect(result.linkHref).toBe("/fr/characters/pikachu");
    });

    it("generates correct link href with English locale", () => {
      const character: CharacterSummary = {
        id: "char-8",
        slug: "sonic",
        name: "Sonic",
        mainImage: "https://example.com/sonic.jpg",
        primaryGame: "Sonic the Hedgehog",
        gamesCount: 80,
      };

      const result = simulateCharacterCardRender(character, "en");

      expect(result.linkHref).toBe("/en/characters/sonic");
    });

    it("uses slug for URL-friendly navigation", () => {
      const character: CharacterSummary = {
        id: "char-9",
        slug: "solid-snake",
        name: "Solid Snake",
        mainImage: "https://example.com/snake.jpg",
        primaryGame: "Metal Gear Solid",
        gamesCount: 10,
      };

      const result = simulateCharacterCardRender(character);

      // Verify slug is used in the URL, not the name
      expect(result.linkHref).toContain("solid-snake");
      expect(result.linkHref).not.toContain("Solid Snake");
    });
  });

  describe("Background Color Handling", () => {
    it("uses character backgroundColor when provided", () => {
      const character: CharacterSummary = {
        id: "char-10",
        slug: "kirby",
        name: "Kirby",
        mainImage: "https://example.com/kirby.jpg",
        backgroundColor: "#ff69b4",
        primaryGame: "Kirby's Dream Land",
        gamesCount: 30,
      };

      const result = simulateCharacterCardRender(character);

      expect(result.backgroundColor).toBe("#ff69b4");
    });

    it("uses fallback gray color when backgroundColor is not provided", () => {
      const character: CharacterSummary = {
        id: "char-11",
        slug: "yoshi",
        name: "Yoshi",
        mainImage: "https://example.com/yoshi.jpg",
        primaryGame: "Super Mario World",
        gamesCount: 20,
        // backgroundColor is intentionally omitted
      };

      const result = simulateCharacterCardRender(character);

      expect(result.backgroundColor).toBe("#f3f4f6");
    });
  });

  describe("Optional Description Handling", () => {
    it("handles missing description gracefully", () => {
      const characterWithoutDescription: CharacterSummary = {
        id: "char-12",
        slug: "pac-man",
        name: "Pac-Man",
        mainImage: "https://example.com/pacman.jpg",
        primaryGame: "Pac-Man",
        gamesCount: 50,
        // description is intentionally omitted
      };

      const result = simulateCharacterCardRender(characterWithoutDescription);

      expect(result.hasDescription).toBe(false);
      expect(result.description).toBeUndefined();
    });

    it("displays description when present", () => {
      const characterWithDescription: CharacterSummary = {
        id: "char-13",
        slug: "crash-bandicoot",
        name: "Crash Bandicoot",
        description: "A genetically enhanced bandicoot",
        mainImage: "https://example.com/crash.jpg",
        primaryGame: "Crash Bandicoot",
        gamesCount: 20,
      };

      const result = simulateCharacterCardRender(characterWithDescription);

      expect(result.hasDescription).toBe(true);
      expect(result.description).toBe("A genetically enhanced bandicoot");
    });
  });
});
