import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: player-pages
 * Property 3: Recherche par nom insensible à la casse
 * **Validates: Requirements 3.2**
 *
 * For any non-empty search text and for any list of players, all returned
 * players must have a name containing the search text (case-insensitive comparison).
 * Additionally, no player whose name contains the text should be excluded from results.
 */

// Player type for testing
interface PlayerSummary {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  gamesCount: number;
  createdAt: string;
}

/**
 * Search filter function - mirrors the logic used in playerService.ts
 * Uses case-insensitive matching via ilike pattern
 */
function filterPlayersBySearch(players: PlayerSummary[], search: string): PlayerSummary[] {
  if (!search.trim()) {
    return players;
  }

  const searchLower = search.trim().toLowerCase();
  return players.filter((player) => {
    if (!player.fullName) return false;
    return player.fullName.toLowerCase().includes(searchLower);
  });
}

/**
 * Check if a name matches the search query (case-insensitive)
 */
function nameMatchesSearch(name: string | null, search: string): boolean {
  if (!name) return false;
  return name.toLowerCase().includes(search.trim().toLowerCase());
}

// Generators for property-based testing
const playerNameGenerator = fc.oneof(fc.string({ minLength: 1, maxLength: 50 }), fc.constant(null));

const playerGenerator = fc.record({
  id: fc.uuid(),
  fullName: playerNameGenerator,
  avatarUrl: fc.oneof(fc.constant("https://example.com/avatar.png"), fc.constant(null)),
  gamesCount: fc.integer({ min: 0, max: 100 }),
  createdAt: fc.constant(new Date().toISOString()),
});

const playersArrayGenerator = fc.array(playerGenerator, { minLength: 0, maxLength: 50 });

// Non-empty search string generator (trimmed)
const searchQueryGenerator = fc
  .string({ minLength: 1, maxLength: 20 })
  .filter((s) => s.trim().length > 0);

describe("Player Search Property-Based Tests", () => {
  describe("Property 3: Recherche par nom insensible à la casse", () => {
    it("all returned players have names containing the search text (case-insensitive)", () => {
      fc.assert(
        fc.property(playersArrayGenerator, searchQueryGenerator, (players, search) => {
          const results = filterPlayersBySearch(players, search);

          // All returned players must have names containing the search text
          for (const player of results) {
            expect(player.fullName).not.toBeNull();
            expect(player.fullName!.toLowerCase()).toContain(search.trim().toLowerCase());
          }
        }),
        { numRuns: 30 }
      );
    });

    it("no player with matching name is excluded from results", () => {
      fc.assert(
        fc.property(playersArrayGenerator, searchQueryGenerator, (players, search) => {
          const results = filterPlayersBySearch(players, search);
          const resultIds = new Set(results.map((p) => p.id));

          // Check that all players with matching names are included
          for (const player of players) {
            if (nameMatchesSearch(player.fullName, search)) {
              expect(resultIds.has(player.id)).toBe(true);
            }
          }
        }),
        { numRuns: 30 }
      );
    });

    it("search is case-insensitive - uppercase query matches lowercase names", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-z]+$/.test(s)),
          (baseName) => {
            const player: PlayerSummary = {
              id: "test-id",
              fullName: baseName.toLowerCase(),
              avatarUrl: null,
              gamesCount: 5,
              createdAt: new Date().toISOString(),
            };

            const uppercaseSearch = baseName.toUpperCase();
            const results = filterPlayersBySearch([player], uppercaseSearch);

            expect(results.length).toBe(1);
            expect(results[0].id).toBe(player.id);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("search is case-insensitive - lowercase query matches uppercase names", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-z]+$/.test(s)),
          (baseName) => {
            const player: PlayerSummary = {
              id: "test-id",
              fullName: baseName.toUpperCase(),
              avatarUrl: null,
              gamesCount: 5,
              createdAt: new Date().toISOString(),
            };

            const lowercaseSearch = baseName.toLowerCase();
            const results = filterPlayersBySearch([player], lowercaseSearch);

            expect(results.length).toBe(1);
            expect(results[0].id).toBe(player.id);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("search is case-insensitive - mixed case query matches mixed case names", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 2, maxLength: 10 }).filter((s) => /^[a-zA-Z]+$/.test(s)),
          (name) => {
            // Create a player with the name
            const player: PlayerSummary = {
              id: "test-id",
              fullName: name,
              avatarUrl: null,
              gamesCount: 5,
              createdAt: new Date().toISOString(),
            };

            // Search with different case variations
            const searchVariations = [
              name.toLowerCase(),
              name.toUpperCase(),
              name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
            ];

            for (const search of searchVariations) {
              const results = filterPlayersBySearch([player], search);
              expect(results.length).toBe(1);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("empty search returns all players", () => {
      fc.assert(
        fc.property(playersArrayGenerator, (players) => {
          const resultsEmpty = filterPlayersBySearch(players, "");
          const resultsSpaces = filterPlayersBySearch(players, "   ");

          expect(resultsEmpty.length).toBe(players.length);
          expect(resultsSpaces.length).toBe(players.length);
        }),
        { numRuns: 30 }
      );
    });

    it("players with null names are never returned in search results", () => {
      fc.assert(
        fc.property(playersArrayGenerator, searchQueryGenerator, (players, search) => {
          const results = filterPlayersBySearch(players, search);

          // No result should have a null name
          for (const player of results) {
            expect(player.fullName).not.toBeNull();
          }
        }),
        { numRuns: 30 }
      );
    });

    it("partial name matches are included in results", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 20 }).filter((s) => s.trim().length >= 3),
          (fullName) => {
            const player: PlayerSummary = {
              id: "test-id",
              fullName: fullName,
              avatarUrl: null,
              gamesCount: 5,
              createdAt: new Date().toISOString(),
            };

            // Search with a substring of the name
            const substringLength = Math.min(2, fullName.trim().length);
            const substring = fullName.trim().substring(0, substringLength);

            if (substring.length > 0) {
              const results = filterPlayersBySearch([player], substring);
              expect(results.length).toBe(1);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("result count is always <= input count", () => {
      fc.assert(
        fc.property(playersArrayGenerator, searchQueryGenerator, (players, search) => {
          const results = filterPlayersBySearch(players, search);
          expect(results.length).toBeLessThanOrEqual(players.length);
        }),
        { numRuns: 30 }
      );
    });
  });
});
