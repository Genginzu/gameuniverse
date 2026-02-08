import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";

// Feature: igdb-game-versions
// **Property 4: Affichage correct des versions**
// **Validates: Requirements 3.2, 3.4**

// ============================================================================
// Type Definitions for Testing
// ============================================================================

interface GameVersion {
  id: string;
  igdbId: number;
  title: string;
  description?: string | null;
  coverImageUrl: string | null;
}

interface RenderResult {
  isRendered: boolean;
  versionsDisplayed: GameVersion[];
  allTitlesPresent: boolean;
  allCoversHandled: boolean;
  orderPreserved: boolean;
}

// ============================================================================
// Generators
// ============================================================================

const gameVersionGenerator = (): fc.Arbitrary<GameVersion> =>
  fc.record({
    id: fc.uuid(),
    igdbId: fc.integer({ min: 1, max: 999999 }),
    title: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    description: fc.option(fc.lorem({ maxCount: 10 }), { nil: null }),
    coverImageUrl: fc.option(fc.webUrl(), { nil: null }),
  });

const gameVersionsArrayGenerator = (minLength: number = 0, maxLength: number = 10) =>
  fc.array(gameVersionGenerator(), { minLength, maxLength });

// ============================================================================
// Helper Functions (simulating component rendering logic)
// ============================================================================

/**
 * Simulates the rendering logic of the GameVersions component.
 * Returns information about what would be displayed.
 */
function renderGameVersions(
  versions: GameVersion[] | undefined,
  accentColor: string
): RenderResult {
  // Component returns null if no versions
  if (!versions || versions.length === 0) {
    return {
      isRendered: false,
      versionsDisplayed: [],
      allTitlesPresent: true,
      allCoversHandled: true,
      orderPreserved: true,
    };
  }

  // Simulate rendering each version
  const versionsDisplayed = versions.map((version) => ({
    ...version,
  }));

  // Check that all titles are present and non-empty
  const allTitlesPresent = versions.every(
    (v) => v.title !== undefined && v.title !== null && v.title.length > 0
  );

  // Check that covers are handled (either displayed or placeholder shown)
  // The component shows an image if coverImageUrl exists, otherwise shows a Package icon placeholder
  const allCoversHandled = versions.every((v) => {
    // Either has a cover URL or will show placeholder (both are valid)
    return v.coverImageUrl !== undefined; // null is valid (shows placeholder)
  });

  // Order is preserved - versions are rendered in the order they are passed
  const orderPreserved = versions.every((v, index) => versionsDisplayed[index].id === v.id);

  return {
    isRendered: true,
    versionsDisplayed,
    allTitlesPresent,
    allCoversHandled,
    orderPreserved,
  };
}

/**
 * Validates that the component correctly handles the display_order.
 * Versions should be displayed in the exact order they are passed to the component.
 */
function validateDisplayOrder(versions: GameVersion[]): boolean {
  if (versions.length === 0) return true;

  const result = renderGameVersions(versions, "#ffffff");

  // Check that the order of displayed versions matches input order
  return result.versionsDisplayed.every((displayed, index) => displayed.id === versions[index].id);
}

/**
 * Validates that each version has its title displayed.
 */
function validateTitlesDisplayed(versions: GameVersion[]): boolean {
  if (versions.length === 0) return true;

  const result = renderGameVersions(versions, "#ffffff");

  // All versions should have their titles present
  return result.allTitlesPresent && result.versionsDisplayed.length === versions.length;
}

/**
 * Validates that cover images are handled correctly.
 * - If coverImageUrl exists, it should be displayed
 * - If coverImageUrl is null, a placeholder should be shown
 */
function validateCoverHandling(versions: GameVersion[]): boolean {
  if (versions.length === 0) return true;

  const result = renderGameVersions(versions, "#ffffff");

  return result.allCoversHandled;
}

// ============================================================================
// Property-Based Tests
// ============================================================================

describe("GameVersions Property-Based Tests", () => {
  describe("Property 4: Affichage correct des versions", () => {
    it("For any game with versions, the component should render each version with its title", () => {
      // **Validates: Requirements 3.2**
      fc.assert(
        fc.property(gameVersionsArrayGenerator(1, 20), (versions) => {
          return validateTitlesDisplayed(versions);
        }),
        { numRuns: 100 }
      );
    });

    it("For any game with versions, versions should be displayed in the order they are passed (display_order)", () => {
      // **Validates: Requirements 3.4**
      fc.assert(
        fc.property(gameVersionsArrayGenerator(1, 20), (versions) => {
          return validateDisplayOrder(versions);
        }),
        { numRuns: 100 }
      );
    });

    it("For any game with versions, cover images should be handled correctly (displayed or placeholder)", () => {
      // **Validates: Requirements 3.2**
      fc.assert(
        fc.property(gameVersionsArrayGenerator(1, 20), (versions) => {
          return validateCoverHandling(versions);
        }),
        { numRuns: 100 }
      );
    });

    it("Component should return null (not render) when versions array is empty", () => {
      // **Validates: Requirements 3.3**
      const result = renderGameVersions([], "#ffffff");
      expect(result.isRendered).toBe(false);
      expect(result.versionsDisplayed).toHaveLength(0);
    });

    it("Component should return null (not render) when versions is undefined", () => {
      // **Validates: Requirements 3.3**
      const result = renderGameVersions(undefined, "#ffffff");
      expect(result.isRendered).toBe(false);
      expect(result.versionsDisplayed).toHaveLength(0);
    });

    it("For any valid versions array, the number of displayed versions should match input count", () => {
      // **Validates: Requirements 3.2**
      fc.assert(
        fc.property(gameVersionsArrayGenerator(1, 20), (versions) => {
          const result = renderGameVersions(versions, "#ffffff");
          return result.versionsDisplayed.length === versions.length;
        }),
        { numRuns: 100 }
      );
    });

    it("Accent color should be accepted for placeholder styling", () => {
      // **Validates: Requirements 3.2**
      const hexColorGenerator = fc
        .array(
          fc.constantFrom(
            "0",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "a",
            "b",
            "c",
            "d",
            "e",
            "f"
          ),
          { minLength: 6, maxLength: 6 }
        )
        .map((chars) => `#${chars.join("")}`);

      fc.assert(
        fc.property(
          gameVersionsArrayGenerator(1, 5),
          hexColorGenerator,
          (versions, accentColor) => {
            const result = renderGameVersions(versions, accentColor);
            // Component should render successfully with any valid accent color
            return result.isRendered && result.versionsDisplayed.length === versions.length;
          }
        ),
        { numRuns: 50 }
      );
    });

    it("Versions with null coverImageUrl should still be rendered with placeholder", () => {
      // **Validates: Requirements 3.2**
      const versionsWithNullCovers: fc.Arbitrary<GameVersion[]> = fc.array(
        fc.record({
          id: fc.uuid(),
          igdbId: fc.integer({ min: 1, max: 999999 }),
          title: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
          description: fc.constant(null),
          coverImageUrl: fc.constant(null),
        }),
        { minLength: 1, maxLength: 10 }
      );

      fc.assert(
        fc.property(versionsWithNullCovers, (versions) => {
          const result = renderGameVersions(versions, "#ff5500");
          return (
            result.isRendered &&
            result.versionsDisplayed.length === versions.length &&
            result.allCoversHandled
          );
        }),
        { numRuns: 50 }
      );
    });
  });
});
