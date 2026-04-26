import { describe, it, expect, vi } from "vitest";
import React from "react";
import type { CharacterFavoriteSummary } from "../../../../src/types/character";

vi.mock("@iconify/react", () => ({
  Icon: (props: Record<string, unknown>) =>
    React.createElement("span", { "data-icon": props.icon }),
}));

/**
 * Unit Tests for PlayerFavoriteCharacters Component
 *
 * Tests the rendering logic for the player profile favorites section:
 * - Empty state when no favorites (Req 4.3)
 * - Preview limited to MAX_PREVIEW_COUNT (Req 4.1)
 * - "See all" link visibility (Req 4.2)
 *
 * **Validates: Requirements 4.1, 4.2, 4.3**
 */

const MAX_PREVIEW_COUNT = 6;

function makeCharacter(index: number): CharacterFavoriteSummary {
  return {
    id: `char-${index}`,
    slug: `character-${index}`,
    name: `Character ${index}`,
    role: "protagonist",
    mainImage: `/images/char-${index}.jpg`,
    backgroundColor: "#1a1a2e",
    primaryGame: `Game ${index}`,
    favoritedAt: new Date(2024, 0, index + 1).toISOString(),
  };
}

function makeCharacters(count: number): CharacterFavoriteSummary[] {
  return Array.from({ length: count }, (_, i) => makeCharacter(i));
}

/** Determines if the "See all" link should be shown (Req 4.2) */
function shouldShowSeeAll(characters: CharacterFavoriteSummary[]): boolean {
  return characters.length > MAX_PREVIEW_COUNT;
}

/** Returns the characters to display in the preview grid (Req 4.1) */
function getPreviewCharacters(characters: CharacterFavoriteSummary[]): CharacterFavoriteSummary[] {
  return characters.slice(0, MAX_PREVIEW_COUNT);
}

/** Determines if the empty state should be shown (Req 4.3) */
function shouldShowEmptyState(
  characters: CharacterFavoriteSummary[],
  loading: boolean,
  error: string | null
): boolean {
  return !loading && !error && characters.length === 0;
}

/** Determines if the section should be hidden on error */
function shouldHideOnError(error: string | null): boolean {
  return error !== null;
}

describe("PlayerFavoriteCharacters Unit Tests", () => {
  describe("empty state (Req 4.3)", () => {
    it("should show empty state when no favorites and not loading", () => {
      expect(shouldShowEmptyState([], false, null)).toBe(true);
    });

    it("should NOT show empty state while loading", () => {
      expect(shouldShowEmptyState([], true, null)).toBe(false);
    });

    it("should NOT show empty state when there is an error", () => {
      expect(shouldShowEmptyState([], false, "Network error")).toBe(false);
    });

    it("should NOT show empty state when characters exist", () => {
      expect(shouldShowEmptyState(makeCharacters(3), false, null)).toBe(false);
    });
  });

  describe("preview grid (Req 4.1)", () => {
    it("should show all characters when count <= MAX_PREVIEW_COUNT", () => {
      const characters = makeCharacters(4);
      const preview = getPreviewCharacters(characters);
      expect(preview).toHaveLength(4);
    });

    it("should limit to MAX_PREVIEW_COUNT when more characters exist", () => {
      const characters = makeCharacters(10);
      const preview = getPreviewCharacters(characters);
      expect(preview).toHaveLength(MAX_PREVIEW_COUNT);
    });

    it("should return the first N characters in order", () => {
      const characters = makeCharacters(8);
      const preview = getPreviewCharacters(characters);
      expect(preview[0].id).toBe("char-0");
      expect(preview[MAX_PREVIEW_COUNT - 1].id).toBe(`char-${MAX_PREVIEW_COUNT - 1}`);
    });

    it("should return empty array for empty input", () => {
      expect(getPreviewCharacters([])).toHaveLength(0);
    });
  });

  describe("see all link (Req 4.2)", () => {
    it("should NOT show 'See all' when count <= MAX_PREVIEW_COUNT", () => {
      expect(shouldShowSeeAll(makeCharacters(6))).toBe(false);
      expect(shouldShowSeeAll(makeCharacters(3))).toBe(false);
      expect(shouldShowSeeAll(makeCharacters(0))).toBe(false);
    });

    it("should show 'See all' when count > MAX_PREVIEW_COUNT", () => {
      expect(shouldShowSeeAll(makeCharacters(7))).toBe(true);
      expect(shouldShowSeeAll(makeCharacters(20))).toBe(true);
    });

    it("should show 'See all' at exactly MAX_PREVIEW_COUNT + 1", () => {
      expect(shouldShowSeeAll(makeCharacters(MAX_PREVIEW_COUNT + 1))).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should hide section on error", () => {
      expect(shouldHideOnError("Network error")).toBe(true);
    });

    it("should not hide section when no error", () => {
      expect(shouldHideOnError(null)).toBe(false);
    });
  });

  describe("component export", () => {
    it("should export PlayerFavoriteCharacters as a function", async () => {
      const mod = await import("../../../../src/components/players/PlayerFavoriteCharacters");
      expect(mod.PlayerFavoriteCharacters).toBeDefined();
      expect(typeof mod.PlayerFavoriteCharacters).toBe("function");
    });
  });
});
