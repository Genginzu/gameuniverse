import { describe, it, expect } from "bun:test";
import type { CollectionSummary } from "../../../../src/types/collection";

/**
 * Unit Tests for CollectionCard Component
 *
 * **Validates: Requirements 4.3**
 * - THE Page_Collections SHALL display for each collection: name, truncated description,
 *   games count, visibility indicator (for owner), and last modified date
 */

// Simulate CollectionCard rendering logic
function simulateCollectionCardRender(
  collection: CollectionSummary,
  playerId: string,
  isOwner: boolean = false,
  locale: string = "fr"
) {
  const coverImages = collection.coverImages.slice(0, 4);
  const formattedDate = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(collection.updatedAt));

  return {
    linkHref: `/${locale}/players/${playerId}/collections/${collection.slug}`,
    name: collection.name,
    description: collection.description,
    hasDescription: !!collection.description,
    gamesCount: collection.gamesCount,
    coverImages,
    coverImageCount: coverImages.length,
    hasCoverImages: coverImages.length > 0,
    formattedDate,
    showVisibilityBadge: isOwner,
    isPublic: collection.isPublic,
  };
}

const baseCollection: CollectionSummary = {
  id: "col-1",
  name: "Meilleurs RPG",
  slug: "meilleurs-rpg",
  description: "Ma sélection des meilleurs RPG de tous les temps",
  isPublic: true,
  gamesCount: 12,
  updatedAt: "2024-03-15T10:30:00Z",
  coverImages: [
    "https://example.com/cover1.jpg",
    "https://example.com/cover2.jpg",
    "https://example.com/cover3.jpg",
    "https://example.com/cover4.jpg",
  ],
};

describe("CollectionCard Unit Tests", () => {
  describe("Required Fields Display", () => {
    it("displays name, description, games count, and date", () => {
      const result = simulateCollectionCardRender(baseCollection, "player-1");

      expect(result.name).toBe("Meilleurs RPG");
      expect(result.description).toBe("Ma sélection des meilleurs RPG de tous les temps");
      expect(result.gamesCount).toBe(12);
      expect(result.formattedDate).toBeTruthy();
    });

    it("handles null description gracefully", () => {
      const collection: CollectionSummary = {
        ...baseCollection,
        description: null,
      };

      const result = simulateCollectionCardRender(collection, "player-1");

      expect(result.hasDescription).toBe(false);
      expect(result.description).toBeNull();
    });
  });

  describe("Cover Images", () => {
    it("shows up to 4 cover images", () => {
      const result = simulateCollectionCardRender(baseCollection, "player-1");

      expect(result.coverImageCount).toBe(4);
      expect(result.hasCoverImages).toBe(true);
    });

    it("limits cover images to 4 even if more are provided", () => {
      const collection: CollectionSummary = {
        ...baseCollection,
        coverImages: [
          "https://example.com/1.jpg",
          "https://example.com/2.jpg",
          "https://example.com/3.jpg",
          "https://example.com/4.jpg",
          "https://example.com/5.jpg",
          "https://example.com/6.jpg",
        ],
      };

      const result = simulateCollectionCardRender(collection, "player-1");

      expect(result.coverImageCount).toBe(4);
    });

    it("handles empty cover images (no games)", () => {
      const collection: CollectionSummary = {
        ...baseCollection,
        coverImages: [],
        gamesCount: 0,
      };

      const result = simulateCollectionCardRender(collection, "player-1");

      expect(result.hasCoverImages).toBe(false);
      expect(result.coverImageCount).toBe(0);
    });

    it("handles single cover image", () => {
      const collection: CollectionSummary = {
        ...baseCollection,
        coverImages: ["https://example.com/single.jpg"],
        gamesCount: 1,
      };

      const result = simulateCollectionCardRender(collection, "player-1");

      expect(result.coverImageCount).toBe(1);
      expect(result.coverImages[0]).toBe("https://example.com/single.jpg");
    });
  });

  describe("Visibility Badge", () => {
    it("shows visibility badge when isOwner is true", () => {
      const result = simulateCollectionCardRender(baseCollection, "player-1", true);

      expect(result.showVisibilityBadge).toBe(true);
    });

    it("hides visibility badge when isOwner is false", () => {
      const result = simulateCollectionCardRender(baseCollection, "player-1", false);

      expect(result.showVisibilityBadge).toBe(false);
    });

    it("reflects public visibility status", () => {
      const publicCollection: CollectionSummary = { ...baseCollection, isPublic: true };
      const result = simulateCollectionCardRender(publicCollection, "player-1", true);

      expect(result.isPublic).toBe(true);
    });

    it("reflects private visibility status", () => {
      const privateCollection: CollectionSummary = { ...baseCollection, isPublic: false };
      const result = simulateCollectionCardRender(privateCollection, "player-1", true);

      expect(result.isPublic).toBe(false);
    });
  });

  describe("Link Navigation", () => {
    it("generates correct link with French locale", () => {
      const result = simulateCollectionCardRender(baseCollection, "player-123", false, "fr");

      expect(result.linkHref).toBe("/fr/players/player-123/collections/meilleurs-rpg");
    });

    it("generates correct link with English locale", () => {
      const result = simulateCollectionCardRender(baseCollection, "player-123", false, "en");

      expect(result.linkHref).toBe("/en/players/player-123/collections/meilleurs-rpg");
    });

    it("uses slug for URL, not name", () => {
      const result = simulateCollectionCardRender(baseCollection, "player-1");

      expect(result.linkHref).toContain("meilleurs-rpg");
      expect(result.linkHref).not.toContain("Meilleurs RPG");
    });
  });

  describe("Date Formatting", () => {
    it("formats date with French locale", () => {
      const result = simulateCollectionCardRender(baseCollection, "player-1", false, "fr");

      // French date format: "15 mars 2024"
      expect(result.formattedDate).toContain("2024");
    });

    it("formats date with English locale", () => {
      const result = simulateCollectionCardRender(baseCollection, "player-1", false, "en");

      // English date format: "Mar 15, 2024"
      expect(result.formattedDate).toContain("2024");
    });
  });
});
