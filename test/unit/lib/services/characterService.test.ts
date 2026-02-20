import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CharacterService } from "../../../../src/lib/services/characterService";
import type {
  CharacterDetails,
  CharacterSummary,
  CharacterMedia,
  CharacterGame,
  CharacterRelationship,
} from "../../../../src/types/character";

describe("CharacterService", () => {
  let originalFetch: typeof fetch;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  const mockCharacterGame: CharacterGame = {
    id: "game-1",
    slug: "test-game",
    title: "Test Game",
    coverImage: "https://example.com/cover.jpg",
    backgroundImage: "https://example.com/bg.jpg",
    releaseYear: 2024,
    isPrimary: true,
  };

  const mockCharacterMedia: CharacterMedia = {
    mainImage: "https://example.com/main.jpg",
    backgroundImage: "https://example.com/bg.jpg",
    screenshots: [
      {
        id: "ss-1",
        url: "https://example.com/ss1.jpg",
        altText: "Screenshot 1",
        isFeatured: true,
      },
    ],
    artwork: [
      {
        id: "art-1",
        url: "https://example.com/art1.jpg",
        type: "concept",
        isFeatured: false,
      },
    ],
    videos: [],
  };

  const mockRelationship: CharacterRelationship = {
    id: "rel-1",
    relatedCharacter: {
      id: "char-2",
      slug: "related-character",
      name: "Related Character",
      mainImage: "https://example.com/related.jpg",
      role: "Ally",
    },
    relationshipType: "ally",
    description: "A trusted ally",
  };

  const mockCharacterDetails: CharacterDetails = {
    id: "char-1",
    slug: "test-character",
    name: "Test Character",
    role: "Hero",
    description: "A test character description",
    biography: "Full biography of the character",
    weapons: "Sword, Shield",
    backgroundColor: "#1a1a2e",
    games: [mockCharacterGame],
    primaryGame: "Test Game",
    media: mockCharacterMedia,
    relationships: [mockRelationship],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  };

  const mockCharacterSummary: CharacterSummary = {
    id: "char-1",
    slug: "test-character",
    name: "Test Character",
    role: "Hero",
    description: "A test character description",
    mainImage: "https://example.com/main.jpg",
    backgroundColor: "#1a1a2e",
    primaryGame: "Test Game",
    gamesCount: 1,
  };

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("fetchCharacterDetails", () => {
    it("should fetch character details successfully", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockCharacterDetails,
      })) as typeof fetch;

      const result = await CharacterService.fetchCharacterDetails("test-character", "en");

      expect(result).toEqual(mockCharacterDetails);
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    it("should return null for 404 response", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: false,
        status: 404,
        text: async () => "Not found",
      })) as typeof fetch;

      const result = await CharacterService.fetchCharacterDetails("non-existent", "en");

      expect(result).toBeNull();
    });

    it("should throw error for non-404 error responses", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => "Server error",
      })) as typeof fetch;

      await expect(CharacterService.fetchCharacterDetails("test-character", "en")).rejects.toThrow(
        "Failed to fetch character details"
      );
    });

    it("should use default locale when not provided", async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockCharacterDetails,
      })) as typeof fetch;
      globalThis.fetch = mockFetch;

      await CharacterService.fetchCharacterDetails("test-character");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("locale=fr"),
        expect.any(Object)
      );
    });

    it("should handle network errors", async () => {
      globalThis.fetch = vi.fn(async () => {
        throw new Error("Network error");
      }) as typeof fetch;

      await expect(CharacterService.fetchCharacterDetails("test-character", "en")).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("fetchCharacters", () => {
    const mockCharactersResponse = {
      characters: [mockCharacterSummary],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };

    it("should fetch characters list successfully", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockCharactersResponse,
      })) as typeof fetch;

      const result = await CharacterService.fetchCharacters();

      expect(result.characters).toHaveLength(1);
      expect(result.characters[0]).toEqual(mockCharacterSummary);
      expect(result.pagination.totalCount).toBe(1);
    });

    it("should pass search parameter", async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockCharactersResponse,
      })) as typeof fetch;
      globalThis.fetch = mockFetch;

      await CharacterService.fetchCharacters({ search: "test" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("search=test"),
        expect.any(Object)
      );
    });

    it("should pass games filter parameter", async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockCharactersResponse,
      })) as typeof fetch;
      globalThis.fetch = mockFetch;

      await CharacterService.fetchCharacters({ games: ["game-1", "game-2"] });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("games=game-1%2Cgame-2"),
        expect.any(Object)
      );
    });

    it("should pass roles filter parameter", async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockCharactersResponse,
      })) as typeof fetch;
      globalThis.fetch = mockFetch;

      await CharacterService.fetchCharacters({ roles: ["Hero", "Villain"] });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("roles=Hero%2CVillain"),
        expect.any(Object)
      );
    });

    it("should pass pagination parameters", async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockCharactersResponse,
      })) as typeof fetch;
      globalThis.fetch = mockFetch;

      await CharacterService.fetchCharacters({ page: 2, limit: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/page=2.*limit=10|limit=10.*page=2/),
        expect.any(Object)
      );
    });

    it("should handle items format response", async () => {
      const itemsResponse = {
        items: [mockCharacterSummary],
        pagination: mockCharactersResponse.pagination,
      };
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => itemsResponse,
      })) as typeof fetch;

      const result = await CharacterService.fetchCharacters();

      expect(result.characters).toHaveLength(1);
      expect(result.characters[0]).toEqual(mockCharacterSummary);
    });

    it("should throw error on failed fetch", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      })) as typeof fetch;

      await expect(CharacterService.fetchCharacters()).rejects.toThrow(
        "Failed to fetch character list"
      );
    });
  });

  describe("characterExists", () => {
    it("should return true when character exists", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockCharacterDetails,
      })) as typeof fetch;

      const result = await CharacterService.characterExists("test-character", "en");

      expect(result).toBe(true);
    });

    it("should return false when character does not exist", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: false,
        status: 404,
        text: async () => "Not found",
      })) as typeof fetch;

      const result = await CharacterService.characterExists("non-existent", "en");

      expect(result).toBe(false);
    });

    it("should return false on error", async () => {
      globalThis.fetch = vi.fn(async () => {
        throw new Error("Network error");
      }) as typeof fetch;

      const result = await CharacterService.characterExists("test-character", "en");

      expect(result).toBe(false);
    });

    it("should use default locale when not provided", async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockCharacterDetails,
      })) as typeof fetch;
      globalThis.fetch = mockFetch;

      await CharacterService.characterExists("test-character");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("locale=fr"),
        expect.any(Object)
      );
    });
  });

  describe("generateCharacterMetadata", () => {
    it("should generate metadata for existing character", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockCharacterDetails,
      })) as typeof fetch;

      const result = await CharacterService.generateCharacterMetadata("test-character", "en");

      expect(result.title).toBe("Test Character - Game Universe");
      expect(result.description).toBe("A test character description");
      expect(result.openGraph?.title).toBe("Test Character");
    });

    it("should generate metadata with main image", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockCharacterDetails,
      })) as typeof fetch;

      const result = await CharacterService.generateCharacterMetadata("test-character", "en");

      expect(result.openGraph?.images).toContain("https://example.com/main.jpg");
    });

    it("should generate French metadata when locale is fr", async () => {
      const characterWithoutDescription = { ...mockCharacterDetails, description: undefined };
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => characterWithoutDescription,
      })) as typeof fetch;

      const result = await CharacterService.generateCharacterMetadata("test-character", "fr");

      expect(result.description).toContain("Découvrez");
      expect(result.description).toContain("Test Character");
    });

    it("should generate English metadata when locale is en", async () => {
      const characterWithoutDescription = { ...mockCharacterDetails, description: undefined };
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => characterWithoutDescription,
      })) as typeof fetch;

      const result = await CharacterService.generateCharacterMetadata("test-character", "en");

      expect(result.description).toContain("Discover");
      expect(result.description).toContain("Test Character");
    });

    it("should include primary game in description", async () => {
      const characterWithoutDescription = { ...mockCharacterDetails, description: undefined };
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => characterWithoutDescription,
      })) as typeof fetch;

      const result = await CharacterService.generateCharacterMetadata("test-character", "en");

      expect(result.description).toContain("Test Game");
    });

    it("should return not found metadata when character does not exist", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: false,
        status: 404,
        text: async () => "Not found",
      })) as typeof fetch;

      const result = await CharacterService.generateCharacterMetadata("non-existent", "en");

      expect(result.title).toContain("not found");
    });

    it("should return error metadata on fetch error", async () => {
      globalThis.fetch = vi.fn(async () => {
        throw new Error("Network error");
      }) as typeof fetch;

      const result = await CharacterService.generateCharacterMetadata("test-character", "en");

      expect(result.title).toBe("Error");
    });

    it("should return French error metadata on fetch error with fr locale", async () => {
      globalThis.fetch = vi.fn(async () => {
        throw new Error("Network error");
      }) as typeof fetch;

      const result = await CharacterService.generateCharacterMetadata("test-character", "fr");

      expect(result.title).toBe("Erreur");
    });
  });
});
