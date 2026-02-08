import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";

/**
 * Feature: library-games-view
 * Property 1: Library-only filtering
 * **Validates: Requirements 1.2, 4.2**
 *
 * For any API request with the library filter enabled and any authenticated user,
 * all returned games should be present in that user's library.
 *
 * This test validates the filtering logic that ensures when inLibrary=true,
 * only games belonging to the authenticated user's library are returned.
 */

// Types representing the domain
interface Game {
  id: string;
  slug: string;
  title: string;
}

interface LibraryEntry {
  userId: string;
  gameId: string;
}

// Pure function that simulates the library filtering logic
function filterGamesByLibrary(
  allGames: Game[],
  libraryEntries: LibraryEntry[],
  userId: string,
  inLibrary: boolean
): Game[] {
  if (!inLibrary) {
    return allGames;
  }

  // Get game IDs in user's library
  const userLibraryGameIds = new Set(
    libraryEntries.filter((entry) => entry.userId === userId).map((entry) => entry.gameId)
  );

  // Filter games to only those in user's library
  return allGames.filter((game) => userLibraryGameIds.has(game.id));
}

// Generators for property-based testing
const gameIdGenerator = fc.uuid();
const userIdGenerator = fc.uuid();
const slugGenerator = fc.stringMatching(/^[a-z0-9-]{3,30}$/);
const titleGenerator = fc.string({ minLength: 1, maxLength: 100 });

const gameGenerator = fc.record({
  id: gameIdGenerator,
  slug: slugGenerator,
  title: titleGenerator,
});

const libraryEntryGenerator = (gameIds: string[], userIds: string[]) =>
  fc.record({
    userId: fc.constantFrom(...(userIds.length > 0 ? userIds : ["default-user"])),
    gameId: fc.constantFrom(...(gameIds.length > 0 ? gameIds : ["default-game"])),
  });

describe("Library Games API Property-Based Tests", () => {
  describe("Property 1: Library-only filtering", () => {
    it("when inLibrary=true, all returned games belong to the user's library", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 1, maxLength: 50 }),
          fc.array(userIdGenerator, { minLength: 1, maxLength: 5 }),
          (games, userIds) => {
            // Generate library entries using existing game and user IDs
            const gameIds = games.map((g) => g.id);

            // Create random library entries
            const libraryEntries: LibraryEntry[] = [];
            for (const userId of userIds) {
              // Each user has some random games in their library
              const numGamesInLibrary = Math.floor(Math.random() * gameIds.length);
              const shuffledGameIds = [...gameIds].sort(() => Math.random() - 0.5);
              for (let i = 0; i < numGamesInLibrary; i++) {
                libraryEntries.push({ userId, gameId: shuffledGameIds[i] });
              }
            }

            // Pick a random user to test
            const testUserId = userIds[0];

            // Get the user's library game IDs
            const userLibraryGameIds = new Set(
              libraryEntries.filter((e) => e.userId === testUserId).map((e) => e.gameId)
            );

            // Filter with inLibrary=true
            const filteredGames = filterGamesByLibrary(games, libraryEntries, testUserId, true);

            // Property: ALL returned games must be in the user's library
            for (const game of filteredGames) {
              expect(userLibraryGameIds.has(game.id)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("when inLibrary=true, no games outside the user's library are returned", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 5, maxLength: 30 }),
          userIdGenerator,
          fc.integer({ min: 0, max: 10 }),
          (games, userId, numInLibrary) => {
            // Create a library with only some games
            const actualNumInLibrary = Math.min(numInLibrary, games.length);
            const libraryEntries: LibraryEntry[] = games
              .slice(0, actualNumInLibrary)
              .map((game) => ({
                userId,
                gameId: game.id,
              }));

            const filteredGames = filterGamesByLibrary(games, libraryEntries, userId, true);

            // Property: returned games count should equal library entries count
            expect(filteredGames.length).toBe(actualNumInLibrary);

            // Property: each returned game should be in the library
            const libraryGameIds = new Set(libraryEntries.map((e) => e.gameId));
            for (const game of filteredGames) {
              expect(libraryGameIds.has(game.id)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("when inLibrary=false, all games are returned regardless of library membership", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 1, maxLength: 30 }),
          userIdGenerator,
          (games, userId) => {
            // Create a partial library
            const libraryEntries: LibraryEntry[] = games
              .slice(0, Math.floor(games.length / 2))
              .map((game) => ({
                userId,
                gameId: game.id,
              }));

            const filteredGames = filterGamesByLibrary(games, libraryEntries, userId, false);

            // Property: when inLibrary=false, all games should be returned
            expect(filteredGames.length).toBe(games.length);
            expect(filteredGames).toEqual(games);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("user A's library filter does not return user B's games", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 4, maxLength: 20 }),
          userIdGenerator,
          userIdGenerator,
          (games, userA, userB) => {
            // Ensure users are different
            fc.pre(userA !== userB);

            // Split games between users - first half to A, second half to B
            const midpoint = Math.floor(games.length / 2);
            const userAGames = games.slice(0, midpoint);
            const userBGames = games.slice(midpoint);

            const libraryEntries: LibraryEntry[] = [
              ...userAGames.map((game) => ({ userId: userA, gameId: game.id })),
              ...userBGames.map((game) => ({ userId: userB, gameId: game.id })),
            ];

            // Filter for user A
            const userAFiltered = filterGamesByLibrary(games, libraryEntries, userA, true);

            // Property: user A should only see their own games
            const userAGameIds = new Set(userAGames.map((g) => g.id));
            for (const game of userAFiltered) {
              expect(userAGameIds.has(game.id)).toBe(true);
            }

            // Property: user A should not see user B's games
            const userBGameIds = new Set(userBGames.map((g) => g.id));
            for (const game of userAFiltered) {
              expect(userBGameIds.has(game.id)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("empty library returns no games when inLibrary=true", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 1, maxLength: 20 }),
          userIdGenerator,
          (games, userId) => {
            // Empty library
            const libraryEntries: LibraryEntry[] = [];

            const filteredGames = filterGamesByLibrary(games, libraryEntries, userId, true);

            // Property: empty library should return no games
            expect(filteredGames.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("library filtering is idempotent - filtering twice gives same result", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 1, maxLength: 20 }),
          userIdGenerator,
          fc.integer({ min: 0, max: 10 }),
          (games, userId, numInLibrary) => {
            const actualNumInLibrary = Math.min(numInLibrary, games.length);
            const libraryEntries: LibraryEntry[] = games
              .slice(0, actualNumInLibrary)
              .map((game) => ({
                userId,
                gameId: game.id,
              }));

            const firstFilter = filterGamesByLibrary(games, libraryEntries, userId, true);
            const secondFilter = filterGamesByLibrary(firstFilter, libraryEntries, userId, true);

            // Property: filtering twice should give the same result
            expect(secondFilter).toEqual(firstFilter);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
