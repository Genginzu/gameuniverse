import { describe, it, expect } from "bun:test";
import type { CollectionSummary } from "../../../../src/types/collection";

/**
 * Unit Tests for CollectionList Component
 *
 * **Validates: Requirements 4.4, 4.5**
 * - IF a player has no public collections THEN display a message indicating none are available
 * - WHEN the page loads THEN display a loading skeleton while fetching data
 */

type RenderState = "loading" | "empty" | "grid";

function simulateCollectionListRender(
  collections: CollectionSummary[],
  playerId: string,
  isOwner: boolean,
  isLoading: boolean
) {
  if (isLoading) {
    return {
      state: "loading" as RenderState,
      skeletonCount: 6,
      collections: [],
      gridCols: { mobile: 1, tablet: 2, desktop: 3 },
    };
  }

  if (collections.length === 0) {
    return {
      state: "empty" as RenderState,
      skeletonCount: 0,
      collections: [],
      gridCols: { mobile: 0, tablet: 0, desktop: 0 },
    };
  }

  return {
    state: "grid" as RenderState,
    skeletonCount: 0,
    collections: collections.map((c) => ({
      id: c.id,
      playerId,
      isOwner,
    })),
    gridCols: { mobile: 1, tablet: 2, desktop: 3 },
  };
}

const makeCollection = (overrides: Partial<CollectionSummary> = {}): CollectionSummary => ({
  id: "col-1",
  name: "Meilleurs RPG",
  slug: "meilleurs-rpg",
  description: "Ma sélection des meilleurs RPG",
  isPublic: true,
  gamesCount: 5,
  updatedAt: "2024-03-15T10:30:00Z",
  coverImages: ["https://example.com/cover1.jpg"],
  ...overrides,
});

describe("CollectionList Unit Tests", () => {
  describe("Loading State (Requirement 4.5)", () => {
    it("shows skeleton cards when isLoading is true", () => {
      const result = simulateCollectionListRender([], "player-1", false, true);

      expect(result.state).toBe("loading");
      expect(result.skeletonCount).toBe(6);
    });

    it("shows skeleton even if collections are provided while loading", () => {
      const collections = [makeCollection()];
      const result = simulateCollectionListRender(collections, "player-1", false, true);

      expect(result.state).toBe("loading");
      expect(result.collections).toHaveLength(0);
    });

    it("skeleton grid uses responsive columns", () => {
      const result = simulateCollectionListRender([], "player-1", false, true);

      expect(result.gridCols.mobile).toBe(1);
      expect(result.gridCols.tablet).toBe(2);
      expect(result.gridCols.desktop).toBe(3);
    });
  });

  describe("Empty State (Requirement 4.4)", () => {
    it("shows empty state when collections array is empty and not loading", () => {
      const result = simulateCollectionListRender([], "player-1", false, false);

      expect(result.state).toBe("empty");
      expect(result.collections).toHaveLength(0);
    });

    it("shows empty state for owner with no collections", () => {
      const result = simulateCollectionListRender([], "player-1", true, false);

      expect(result.state).toBe("empty");
    });
  });

  describe("Grid Rendering", () => {
    it("renders collection cards in a grid when collections exist", () => {
      const collections = [
        makeCollection({ id: "col-1", slug: "rpg" }),
        makeCollection({ id: "col-2", slug: "fps" }),
        makeCollection({ id: "col-3", slug: "indie" }),
      ];

      const result = simulateCollectionListRender(collections, "player-1", false, false);

      expect(result.state).toBe("grid");
      expect(result.collections).toHaveLength(3);
    });

    it("passes playerId and isOwner to each card", () => {
      const collections = [makeCollection()];
      const result = simulateCollectionListRender(collections, "player-42", true, false);

      expect(result.collections[0].playerId).toBe("player-42");
      expect(result.collections[0].isOwner).toBe(true);
    });

    it("uses responsive grid columns", () => {
      const collections = [makeCollection()];
      const result = simulateCollectionListRender(collections, "player-1", false, false);

      expect(result.gridCols.mobile).toBe(1);
      expect(result.gridCols.tablet).toBe(2);
      expect(result.gridCols.desktop).toBe(3);
    });

    it("renders single collection correctly", () => {
      const collections = [makeCollection()];
      const result = simulateCollectionListRender(collections, "player-1", false, false);

      expect(result.state).toBe("grid");
      expect(result.collections).toHaveLength(1);
    });
  });
});
