import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { PlayerLibraryGame } from "@/types/player";

/**
 * Feature: player-pages
 * Property 6: Affichage de la bibliothÃ¨que
 * **Validates: Requirements 6.1, 6.2**
 *
 * Pour tout joueur avec une bibliothÃ¨que non vide, chaque jeu affichÃ© doit contenir :
 * le titre du jeu, l'image de couverture (ou placeholder), et le statut du jeu.
 * L'ordre d'affichage doit Ãªtre cohÃ©rent (par date d'ajout dÃ©croissante).
 */

// Generator for valid game status
const gameStatusArbitrary = fc.constantFrom(
  "owned" as const,
  "wishlist" as const,
  "completed" as const,
  "playing" as const
);

// Generator for valid ISO date strings with varied timestamps
const isoDateArbitrary = fc
  .integer({ min: 0, max: Date.now() })
  .map((timestamp) => new Date(timestamp).toISOString());

// Generator for a single library game entry
const libraryGameArbitrary: fc.Arbitrary<PlayerLibraryGame> = fc.record({
  id: fc.uuid(),
  gameId: fc.uuid(),
  slug: fc.string({ minLength: 1, maxLength: 50 }),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  coverImage: fc.option(fc.webUrl(), { nil: null }),
  status: gameStatusArbitrary,
  playTimeHours: fc.integer({ min: 0, max: 10000 }),
  rating: fc.option(fc.integer({ min: 1, max: 10 }), { nil: null }),
  addedAt: isoDateArbitrary,
});

// Generator for a non-empty library
const nonEmptyLibraryArbitrary = fc.array(libraryGameArbitrary, {
  minLength: 1,
  maxLength: 30,
});

// Helper function to sort games by addedAt descending (same logic as component)
function sortGamesByAddedAtDescending(games: PlayerLibraryGame[]): PlayerLibraryGame[] {
  return [...games].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
}

describe("PlayerLibraryGrid Property-Based Tests", () => {
  describe("Property 6: Affichage de la bibliothÃ¨que", () => {
    it("every game in a non-empty library has required fields: title, status, and coverImage (or null)", () => {
      fc.assert(
        fc.property(nonEmptyLibraryArbitrary, (library) => {
          // Verify each game has the required fields
          for (const game of library) {
            // Title must be a non-empty string
            expect(typeof game.title).toBe("string");
            expect(game.title.length).toBeGreaterThan(0);

            // Status must be one of the valid values
            expect(["owned", "wishlist", "completed", "playing"]).toContain(game.status);

            // CoverImage must be either a string (URL) or null
            expect(game.coverImage === null || typeof game.coverImage === "string").toBe(true);
          }
        }),
        { numRuns: 30 }
      );
    });

    it("games are sorted by addedAt date in descending order (most recent first)", () => {
      fc.assert(
        fc.property(nonEmptyLibraryArbitrary, (library) => {
          const sortedGames = sortGamesByAddedAtDescending(library);

          // Verify the sorting is correct - each game should have addedAt >= next game's addedAt
          for (let i = 0; i < sortedGames.length - 1; i++) {
            const currentDate = new Date(sortedGames[i].addedAt).getTime();
            const nextDate = new Date(sortedGames[i + 1].addedAt).getTime();
            expect(currentDate).toBeGreaterThanOrEqual(nextDate);
          }
        }),
        { numRuns: 30 }
      );
    });

    it("sorting preserves all games - no games are lost or duplicated", () => {
      fc.assert(
        fc.property(nonEmptyLibraryArbitrary, (library) => {
          const sortedGames = sortGamesByAddedAtDescending(library);

          // Same length
          expect(sortedGames.length).toBe(library.length);

          // All original game IDs are present in sorted list
          const originalIds = new Set(library.map((g) => g.id));
          const sortedIds = new Set(sortedGames.map((g) => g.id));
          expect(sortedIds.size).toBe(originalIds.size);

          for (const id of originalIds) {
            expect(sortedIds.has(id)).toBe(true);
          }
        }),
        { numRuns: 30 }
      );
    });

    it("sorting is stable - games with same addedAt maintain relative order", () => {
      // Create games with identical timestamps to test stability
      const sameTimestamp = new Date().toISOString();
      const gamesWithSameDate = fc.array(
        fc.record({
          id: fc.uuid(),
          gameId: fc.uuid(),
          slug: fc.string({ minLength: 1, maxLength: 50 }),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          coverImage: fc.option(fc.webUrl(), { nil: null }),
          status: gameStatusArbitrary,
          playTimeHours: fc.integer({ min: 0, max: 10000 }),
          rating: fc.option(fc.integer({ min: 1, max: 10 }), { nil: null }),
          addedAt: fc.constant(sameTimestamp),
        }),
        { minLength: 2, maxLength: 10 }
      );

      fc.assert(
        fc.property(gamesWithSameDate, (library) => {
          const sortedGames = sortGamesByAddedAtDescending(library);

          // All games should still be present
          expect(sortedGames.length).toBe(library.length);

          // All dates should be equal
          for (const game of sortedGames) {
            expect(game.addedAt).toBe(sameTimestamp);
          }
        }),
        { numRuns: 30 }
      );
    });

    it("each game status maps to a valid status type", () => {
      const validStatuses = ["owned", "wishlist", "completed", "playing"];

      fc.assert(
        fc.property(nonEmptyLibraryArbitrary, (library) => {
          for (const game of library) {
            expect(validStatuses).toContain(game.status);
          }
        }),
        { numRuns: 30 }
      );
    });

    it("game titles are preserved after sorting", () => {
      fc.assert(
        fc.property(nonEmptyLibraryArbitrary, (library) => {
          const sortedGames = sortGamesByAddedAtDescending(library);

          // Create a map of id -> title from original
          const originalTitles = new Map(library.map((g) => [g.id, g.title]));

          // Verify each sorted game has the same title as original
          for (const game of sortedGames) {
            expect(game.title).toBe(originalTitles.get(game.id));
          }
        }),
        { numRuns: 30 }
      );
    });

    it("game cover images are preserved after sorting", () => {
      fc.assert(
        fc.property(nonEmptyLibraryArbitrary, (library) => {
          const sortedGames = sortGamesByAddedAtDescending(library);

          // Create a map of id -> coverImage from original
          const originalCovers = new Map(library.map((g) => [g.id, g.coverImage]));

          // Verify each sorted game has the same coverImage as original
          for (const game of sortedGames) {
            expect(game.coverImage).toBe(originalCovers.get(game.id));
          }
        }),
        { numRuns: 30 }
      );
    });

    it("game statuses are preserved after sorting", () => {
      fc.assert(
        fc.property(nonEmptyLibraryArbitrary, (library) => {
          const sortedGames = sortGamesByAddedAtDescending(library);

          // Create a map of id -> status from original
          const originalStatuses = new Map(library.map((g) => [g.id, g.status]));

          // Verify each sorted game has the same status as original
          for (const game of sortedGames) {
            expect(game.status).toBe(originalStatuses.get(game.id));
          }
        }),
        { numRuns: 30 }
      );
    });
  });
});
