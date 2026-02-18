import { describe, it, expect } from "bun:test";
import {
  generateSlug,
  calculateNextPosition,
  reorderPositions,
} from "../../../../src/lib/services/collectionService";
import type { CollectionItem } from "../../../../src/types/collection";

/**
 * Unit Tests for collectionService utility functions
 *
 * Tests edge cases for slug generation, position calculation, and reordering.
 * **Validates: Requirements 1.3, 2.1, 2.3**
 */

// --- Helper to build a minimal CollectionItem ---
function makeItem(overrides: Partial<CollectionItem> & { position: number }): CollectionItem {
  return {
    id: "item-1",
    gameId: "game-1",
    slug: "game-slug",
    title: "Game",
    coverImage: null,
    genres: [],
    note: null,
    addedAt: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

// --- generateSlug ---

describe("generateSlug", () => {
  it("converts a simple name to lowercase slug", () => {
    expect(generateSlug("Meilleurs RPG")).toBe("meilleurs-rpg");
  });

  it("handles accented characters (transliteration)", () => {
    expect(generateSlug("Nostalgie été")).toBe("nostalgie-ete");
    expect(generateSlug("À jouer bientôt")).toBe("a-jouer-bientot");
  });

  it("replaces multiple spaces with a single hyphen", () => {
    expect(generateSlug("My   Great   List")).toBe("my-great-list");
  });

  it("strips leading and trailing special characters", () => {
    expect(generateSlug("--Hello World--")).toBe("hello-world");
    expect(generateSlug("  spaces  ")).toBe("spaces");
  });

  it("handles names with only special characters by returning fallback", () => {
    expect(generateSlug("!!!")).toBe("collection");
    expect(generateSlug("@#$%^&*")).toBe("collection");
  });

  it("handles mixed unicode and ASCII", () => {
    const slug = generateSlug("日本語ゲーム test");
    // Non-latin chars are stripped, leaving "test"
    expect(slug).toMatch(/^[a-z0-9-]+$/);
    expect(slug.length).toBeGreaterThan(0);
  });

  it("collapses consecutive hyphens from mixed special chars", () => {
    expect(generateSlug("a---b___c")).toBe("a-b-c");
  });

  it("handles single character name", () => {
    expect(generateSlug("A")).toBe("a");
  });

  it("handles numeric-only name", () => {
    expect(generateSlug("12345")).toBe("12345");
  });
});

// --- calculateNextPosition ---

describe("calculateNextPosition", () => {
  it("returns 0 for an empty collection", () => {
    expect(calculateNextPosition([])).toBe(0);
  });

  it("returns the count of existing items", () => {
    const items = [makeItem({ position: 0 }), makeItem({ position: 1 }), makeItem({ position: 2 })];
    expect(calculateNextPosition(items)).toBe(3);
  });

  it("returns 1 for a single-item collection", () => {
    expect(calculateNextPosition([makeItem({ position: 0 })])).toBe(1);
  });
});

// --- reorderPositions ---

describe("reorderPositions", () => {
  it("removes the item at the given index", () => {
    const items = [{ gameId: "a" }, { gameId: "b" }, { gameId: "c" }];
    const result = reorderPositions(items, 1);
    expect(result.map((r) => r.gameId)).toEqual(["a", "c"]);
  });

  it("assigns contiguous positions starting from 0", () => {
    const items = [{ gameId: "a" }, { gameId: "b" }, { gameId: "c" }, { gameId: "d" }];
    const result = reorderPositions(items, 2);
    expect(result.map((r) => r.position)).toEqual([0, 1, 2]);
  });

  it("handles removing the first item", () => {
    const items = [{ gameId: "a" }, { gameId: "b" }];
    const result = reorderPositions(items, 0);
    expect(result).toEqual([{ gameId: "b", position: 0 }]);
  });

  it("handles removing the last item", () => {
    const items = [{ gameId: "a" }, { gameId: "b" }];
    const result = reorderPositions(items, 1);
    expect(result).toEqual([{ gameId: "a", position: 0 }]);
  });

  it("returns empty array when removing the only item", () => {
    const result = reorderPositions([{ gameId: "a" }], 0);
    expect(result).toEqual([]);
  });

  it("handles out-of-bounds index gracefully (no removal)", () => {
    const items = [{ gameId: "a" }, { gameId: "b" }];
    const result = reorderPositions(items, 5);
    // No item at index 5, so all items remain
    expect(result.length).toBe(2);
    expect(result.map((r) => r.position)).toEqual([0, 1]);
  });
});
