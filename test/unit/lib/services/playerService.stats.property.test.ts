import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { PlayerService } from "../../../../src/lib/services/playerService";
import type { PlayerLibraryGame, PlayerStats } from "../../../../src/types/player";

/**
 * Feature: player-pages
 * Property 7: Calcul des statistiques
 * **Validates: Requirements 6.4**
 *
 * Pour tout joueur, les statistiques affichÃ©es doivent Ãªtre mathÃ©matiquement correctes :
 * - totalGames = nombre d'entrÃ©es dans user_library
 * - completedGames = nombre d'entrÃ©es avec status = 'completed'
 * - totalPlayTime = somme de play_time_hours
 * - averageRating = moyenne des ratings non-null (ou null si aucun rating)
 */

// Generator for valid game status
const gameStatusArbitrary = fc.constantFrom(
  "owned" as const,
  "wishlist" as const,
  "completed" as const,
  "playing" as const
);

// Generator for valid ISO date strings
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

// Generator for a library (array of games)
const libraryArbitrary = fc.array(libraryGameArbitrary, { minLength: 0, maxLength: 50 });

describe("PlayerService Statistics Property-Based Tests", () => {
  describe("Property 7: Calcul des statistiques", () => {
    it("totalGames equals the number of entries in the library", () => {
      fc.assert(
        fc.property(libraryArbitrary, (library) => {
          const stats = PlayerService.calculateStats(library);
          expect(stats.totalGames).toBe(library.length);
        }),
        { numRuns: 30 }
      );
    });

    it("completedGames equals the count of entries with status 'completed'", () => {
      fc.assert(
        fc.property(libraryArbitrary, (library) => {
          const stats = PlayerService.calculateStats(library);
          const expectedCompleted = library.filter((g) => g.status === "completed").length;
          expect(stats.completedGames).toBe(expectedCompleted);
        }),
        { numRuns: 30 }
      );
    });

    it("ownedGames equals count of entries with status 'owned', 'completed', or 'playing'", () => {
      fc.assert(
        fc.property(libraryArbitrary, (library) => {
          const stats = PlayerService.calculateStats(library);
          const expectedOwned = library.filter(
            (g) => g.status === "owned" || g.status === "completed" || g.status === "playing"
          ).length;
          expect(stats.ownedGames).toBe(expectedOwned);
        }),
        { numRuns: 30 }
      );
    });

    it("totalPlayTime equals the sum of all playTimeHours", () => {
      fc.assert(
        fc.property(libraryArbitrary, (library) => {
          const stats = PlayerService.calculateStats(library);
          const expectedPlayTime = library.reduce((sum, g) => sum + (g.playTimeHours || 0), 0);
          expect(stats.totalPlayTime).toBe(expectedPlayTime);
        }),
        { numRuns: 30 }
      );
    });

    it("averageRating is null when no games have ratings", () => {
      // Generate library where all ratings are null
      const libraryWithNoRatings = fc.array(
        fc.record({
          id: fc.uuid(),
          gameId: fc.uuid(),
          slug: fc.string({ minLength: 1, maxLength: 50 }),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          coverImage: fc.option(fc.webUrl(), { nil: null }),
          status: gameStatusArbitrary,
          playTimeHours: fc.integer({ min: 0, max: 10000 }),
          rating: fc.constant(null),
          addedAt: isoDateArbitrary,
        }),
        { minLength: 0, maxLength: 20 }
      );

      fc.assert(
        fc.property(libraryWithNoRatings, (library) => {
          const stats = PlayerService.calculateStats(library);
          expect(stats.averageRating).toBeNull();
        }),
        { numRuns: 30 }
      );
    });

    it("averageRating is correctly calculated as mean of non-null ratings", () => {
      // Generate library where at least some games have ratings
      const libraryWithRatings = fc.array(libraryGameArbitrary, { minLength: 1, maxLength: 30 });

      fc.assert(
        fc.property(libraryWithRatings, (library) => {
          const stats = PlayerService.calculateStats(library);
          const gamesWithRatings = library.filter((g) => g.rating !== null);

          if (gamesWithRatings.length === 0) {
            expect(stats.averageRating).toBeNull();
          } else {
            const expectedAverage =
              gamesWithRatings.reduce((sum, g) => sum + (g.rating || 0), 0) /
              gamesWithRatings.length;
            expect(stats.averageRating).toBeCloseTo(expectedAverage, 10);
          }
        }),
        { numRuns: 30 }
      );
    });

    it("empty library produces zero stats with null average rating", () => {
      const stats = PlayerService.calculateStats([]);
      expect(stats.totalGames).toBe(0);
      expect(stats.ownedGames).toBe(0);
      expect(stats.completedGames).toBe(0);
      expect(stats.totalPlayTime).toBe(0);
      expect(stats.averageRating).toBeNull();
    });

    it("stats are always non-negative", () => {
      fc.assert(
        fc.property(libraryArbitrary, (library) => {
          const stats = PlayerService.calculateStats(library);
          expect(stats.totalGames).toBeGreaterThanOrEqual(0);
          expect(stats.ownedGames).toBeGreaterThanOrEqual(0);
          expect(stats.completedGames).toBeGreaterThanOrEqual(0);
          expect(stats.totalPlayTime).toBeGreaterThanOrEqual(0);
          if (stats.averageRating !== null) {
            expect(stats.averageRating).toBeGreaterThanOrEqual(0);
          }
        }),
        { numRuns: 30 }
      );
    });

    it("completedGames is always less than or equal to totalGames", () => {
      fc.assert(
        fc.property(libraryArbitrary, (library) => {
          const stats = PlayerService.calculateStats(library);
          expect(stats.completedGames).toBeLessThanOrEqual(stats.totalGames);
        }),
        { numRuns: 30 }
      );
    });

    it("ownedGames is always less than or equal to totalGames", () => {
      fc.assert(
        fc.property(libraryArbitrary, (library) => {
          const stats = PlayerService.calculateStats(library);
          expect(stats.ownedGames).toBeLessThanOrEqual(stats.totalGames);
        }),
        { numRuns: 30 }
      );
    });
  });
});
