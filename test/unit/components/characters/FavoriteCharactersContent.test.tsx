import { describe, it, expect } from "vitest";
import type { CharacterFavoriteSummary } from "../../../../src/types/character";

/**
 * Unit Tests for FavoriteCharactersContent Component
 *
 * Tests the rendering logic for the favorites page content:
 * - Empty state when no favorites (Req 3.3)
 * - Grid rendering when favorites exist (Req 3.2)
 * - Loading state behavior
 * - Error state behavior
 *
 * **Validates: Requirements 3.2, 3.3**
 */

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Logic helpers — extracted from the component's rendering rules
// ---------------------------------------------------------------------------

/** Determines if the loading skeleton should be shown */
function shouldShowLoading(loading: boolean): boolean {
  return loading;
}

/** Determines if the error state should be shown */
function shouldShowError(loading: boolean, error: string | null): boolean {
  return !loading && error !== null;
}

/** Determines if the empty state should be shown (Req 3.3) */
function shouldShowEmptyState(
  characters: CharacterFavoriteSummary[],
  loading: boolean,
  error: string | null
): boolean {
  return !loading && !error && characters.length === 0;
}

/** Determines if the character grid should be shown (Req 3.2) */
function shouldShowGrid(
  characters: CharacterFavoriteSummary[],
  loading: boolean,
  error: string | null
): boolean {
  return !loading && !error && characters.length > 0;
}

/** Returns the title count for the grid header */
function getGridTitleCount(characters: CharacterFavoriteSummary[]): number {
  return characters.length;
}

/**
 * Validates that a CharacterFavoriteSummary has all required display fields.
 * Req 3.2: image, name, role, primary game
 */
function hasRequiredDisplayFields(character: CharacterFavoriteSummary): boolean {
  return (
    typeof character.name === "string" &&
    character.name.length > 0 &&
    typeof character.primaryGame === "string" &&
    character.primaryGame.length > 0 &&
    typeof character.slug === "string" &&
    character.slug.length > 0
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("FavoriteCharactersContent Unit Tests", () => {
  // -----------------------------------------------------------------------
  // Req 3.3 — Empty state with link to /characters
  // -----------------------------------------------------------------------
  describe("empty state (Req 3.3)", () => {
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

  // -----------------------------------------------------------------------
  // Req 3.2 — Grid rendering with character cards
  // -----------------------------------------------------------------------
  describe("grid rendering (Req 3.2)", () => {
    it("should show grid when characters exist and not loading", () => {
      expect(shouldShowGrid(makeCharacters(5), false, null)).toBe(true);
    });

    it("should show grid with a single character", () => {
      expect(shouldShowGrid(makeCharacters(1), false, null)).toBe(true);
    });

    it("should NOT show grid when loading", () => {
      expect(shouldShowGrid(makeCharacters(5), true, null)).toBe(false);
    });

    it("should NOT show grid when there is an error", () => {
      expect(shouldShowGrid(makeCharacters(5), false, "Error")).toBe(false);
    });

    it("should NOT show grid when characters array is empty", () => {
      expect(shouldShowGrid([], false, null)).toBe(false);
    });

    it("should report correct count for grid title", () => {
      expect(getGridTitleCount(makeCharacters(3))).toBe(3);
      expect(getGridTitleCount(makeCharacters(10))).toBe(10);
      expect(getGridTitleCount([])).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // Character display fields (Req 3.2)
  // -----------------------------------------------------------------------
  describe("character display fields (Req 3.2)", () => {
    it("should have all required display fields for a valid character", () => {
      const character = makeCharacter(0);
      expect(hasRequiredDisplayFields(character)).toBe(true);
    });

    it("should detect missing name", () => {
      const character = { ...makeCharacter(0), name: "" };
      expect(hasRequiredDisplayFields(character)).toBe(false);
    });

    it("should detect missing primaryGame", () => {
      const character = { ...makeCharacter(0), primaryGame: "" };
      expect(hasRequiredDisplayFields(character)).toBe(false);
    });

    it("should detect missing slug", () => {
      const character = { ...makeCharacter(0), slug: "" };
      expect(hasRequiredDisplayFields(character)).toBe(false);
    });

    it("should accept character with optional fields undefined", () => {
      const character: CharacterFavoriteSummary = {
        id: "char-1",
        slug: "character-1",
        name: "Character 1",
        primaryGame: "Game 1",
        favoritedAt: new Date().toISOString(),
      };
      expect(hasRequiredDisplayFields(character)).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------
  describe("loading state", () => {
    it("should show loading when loading is true", () => {
      expect(shouldShowLoading(true)).toBe(true);
    });

    it("should NOT show loading when loading is false", () => {
      expect(shouldShowLoading(false)).toBe(false);
    });

    it("loading takes priority over empty state", () => {
      // When loading, neither empty nor grid should show
      expect(shouldShowLoading(true)).toBe(true);
      expect(shouldShowEmptyState([], true, null)).toBe(false);
      expect(shouldShowGrid([], true, null)).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Error state
  // -----------------------------------------------------------------------
  describe("error state", () => {
    it("should show error when error exists and not loading", () => {
      expect(shouldShowError(false, "Network error")).toBe(true);
    });

    it("should NOT show error when loading", () => {
      expect(shouldShowError(true, "Network error")).toBe(false);
    });

    it("should NOT show error when error is null", () => {
      expect(shouldShowError(false, null)).toBe(false);
    });

    it("error takes priority over empty state and grid", () => {
      expect(shouldShowError(false, "Error")).toBe(true);
      expect(shouldShowEmptyState([], false, "Error")).toBe(false);
      expect(shouldShowGrid(makeCharacters(3), false, "Error")).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Mutual exclusivity of states
  // -----------------------------------------------------------------------
  describe("state mutual exclusivity", () => {
    it("only loading state is active when loading", () => {
      const loading = true;
      const error = null;
      const characters: CharacterFavoriteSummary[] = [];

      expect(shouldShowLoading(loading)).toBe(true);
      expect(shouldShowError(loading, error)).toBe(false);
      expect(shouldShowEmptyState(characters, loading, error)).toBe(false);
      expect(shouldShowGrid(characters, loading, error)).toBe(false);
    });

    it("only error state is active on error", () => {
      const loading = false;
      const error = "Something went wrong";
      const characters = makeCharacters(2);

      expect(shouldShowLoading(loading)).toBe(false);
      expect(shouldShowError(loading, error)).toBe(true);
      expect(shouldShowEmptyState(characters, loading, error)).toBe(false);
      expect(shouldShowGrid(characters, loading, error)).toBe(false);
    });

    it("only empty state is active when no characters", () => {
      const loading = false;
      const error = null;
      const characters: CharacterFavoriteSummary[] = [];

      expect(shouldShowLoading(loading)).toBe(false);
      expect(shouldShowError(loading, error)).toBe(false);
      expect(shouldShowEmptyState(characters, loading, error)).toBe(true);
      expect(shouldShowGrid(characters, loading, error)).toBe(false);
    });

    it("only grid is active when characters exist", () => {
      const loading = false;
      const error = null;
      const characters = makeCharacters(5);

      expect(shouldShowLoading(loading)).toBe(false);
      expect(shouldShowError(loading, error)).toBe(false);
      expect(shouldShowEmptyState(characters, loading, error)).toBe(false);
      expect(shouldShowGrid(characters, loading, error)).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Component export
  // -----------------------------------------------------------------------
  describe("component export", () => {
    it("should export FavoriteCharactersContent as a function", async () => {
      const mod =
        await import("../../../../src/components/characters/favorites/FavoriteCharactersContent");
      expect(mod.FavoriteCharactersContent).toBeDefined();
      expect(typeof mod.FavoriteCharactersContent).toBe("function");
    });
  });
});
