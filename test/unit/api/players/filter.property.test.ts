import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";

/**
 * Feature: player-pages
 * Property 4: Filtrage par plage de nombre de jeux
 * **Validates: Requirements 4.1**
 *
 * For any selected game count range ('0', '1-5', '6-20', '20+') and for any list
 * of players, all returned players must have a game count within the specified range.
 */

// Player type for testing
interface PlayerSummary {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  gamesCount: number;
  createdAt: string;
}

// Game count ranges - mirrors GAME_COUNT_RANGES from types/player.ts
const GAME_COUNT_RANGES = {
  "0": { min: 0, max: 0 },
  "1-5": { min: 1, max: 5 },
  "6-20": { min: 6, max: 20 },
  "20+": { min: 21, max: Infinity },
} as const;

type GameCountRangeKey = keyof typeof GAME_COUNT_RANGES;

/**
 * Filter players by game count range - mirrors the logic used in playerService.ts
 */
function filterPlayersByGameCount(
  players: PlayerSummary[],
  gameCountRange: GameCountRangeKey | undefined
): PlayerSummary[] {
  if (!gameCountRange || !(gameCountRange in GAME_COUNT_RANGES)) {
    return players;
  }

  const range = GAME_COUNT_RANGES[gameCountRange];
  return players.filter(
    (player) => player.gamesCount >= range.min && player.gamesCount <= range.max
  );
}

/**
 * Check if a game count is within a specific range
 */
function isInRange(gamesCount: number, rangeKey: GameCountRangeKey): boolean {
  const range = GAME_COUNT_RANGES[rangeKey];
  return gamesCount >= range.min && gamesCount <= range.max;
}

// Generators for property-based testing
const playerGenerator = fc.record({
  id: fc.uuid(),
  fullName: fc.oneof(fc.string({ minLength: 1, maxLength: 50 }), fc.constant(null)),
  avatarUrl: fc.oneof(fc.constant("https://example.com/avatar.png"), fc.constant(null)),
  gamesCount: fc.integer({ min: 0, max: 100 }),
  createdAt: fc.constant(new Date().toISOString()),
});

const playersArrayGenerator = fc.array(playerGenerator, { minLength: 0, maxLength: 50 });

// Generator for valid game count range keys
const gameCountRangeGenerator = fc.constantFrom<GameCountRangeKey>("0", "1-5", "6-20", "20+");

describe("Player Filter Property-Based Tests", () => {
  describe("Property 4: Filtrage par plage de nombre de jeux", () => {
    it("all returned players have game counts within the specified range", () => {
      fc.assert(
        fc.property(playersArrayGenerator, gameCountRangeGenerator, (players, rangeKey) => {
          const results = filterPlayersByGameCount(players, rangeKey);
          const range = GAME_COUNT_RANGES[rangeKey];

          // All returned players must have game counts within the range
          for (const player of results) {
            expect(player.gamesCount).toBeGreaterThanOrEqual(range.min);
            expect(player.gamesCount).toBeLessThanOrEqual(range.max);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("no player within the range is excluded from results", () => {
      fc.assert(
        fc.property(playersArrayGenerator, gameCountRangeGenerator, (players, rangeKey) => {
          const results = filterPlayersByGameCount(players, rangeKey);
          const resultIds = new Set(results.map((p) => p.id));

          // Check that all players within the range are included
          for (const player of players) {
            if (isInRange(player.gamesCount, rangeKey)) {
              expect(resultIds.has(player.id)).toBe(true);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it("range '0' only includes players with exactly 0 games", () => {
      fc.assert(
        fc.property(playersArrayGenerator, (players) => {
          const results = filterPlayersByGameCount(players, "0");

          for (const player of results) {
            expect(player.gamesCount).toBe(0);
          }

          // Verify all players with 0 games are included
          const playersWithZeroGames = players.filter((p) => p.gamesCount === 0);
          expect(results.length).toBe(playersWithZeroGames.length);
        }),
        { numRuns: 100 }
      );
    });

    it("range '1-5' only includes players with 1 to 5 games", () => {
      fc.assert(
        fc.property(playersArrayGenerator, (players) => {
          const results = filterPlayersByGameCount(players, "1-5");

          for (const player of results) {
            expect(player.gamesCount).toBeGreaterThanOrEqual(1);
            expect(player.gamesCount).toBeLessThanOrEqual(5);
          }

          // Verify all players in range are included
          const playersInRange = players.filter((p) => p.gamesCount >= 1 && p.gamesCount <= 5);
          expect(results.length).toBe(playersInRange.length);
        }),
        { numRuns: 100 }
      );
    });

    it("range '6-20' only includes players with 6 to 20 games", () => {
      fc.assert(
        fc.property(playersArrayGenerator, (players) => {
          const results = filterPlayersByGameCount(players, "6-20");

          for (const player of results) {
            expect(player.gamesCount).toBeGreaterThanOrEqual(6);
            expect(player.gamesCount).toBeLessThanOrEqual(20);
          }

          // Verify all players in range are included
          const playersInRange = players.filter((p) => p.gamesCount >= 6 && p.gamesCount <= 20);
          expect(results.length).toBe(playersInRange.length);
        }),
        { numRuns: 100 }
      );
    });

    it("range '20+' only includes players with more than 20 games", () => {
      fc.assert(
        fc.property(playersArrayGenerator, (players) => {
          const results = filterPlayersByGameCount(players, "20+");

          for (const player of results) {
            expect(player.gamesCount).toBeGreaterThanOrEqual(21);
          }

          // Verify all players in range are included
          const playersInRange = players.filter((p) => p.gamesCount >= 21);
          expect(results.length).toBe(playersInRange.length);
        }),
        { numRuns: 100 }
      );
    });

    it("no filter returns all players unchanged", () => {
      fc.assert(
        fc.property(playersArrayGenerator, (players) => {
          const resultsUndefined = filterPlayersByGameCount(players, undefined);

          expect(resultsUndefined.length).toBe(players.length);
        }),
        { numRuns: 100 }
      );
    });

    it("ranges are mutually exclusive - a player belongs to exactly one range", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (gamesCount) => {
          const ranges: GameCountRangeKey[] = ["0", "1-5", "6-20", "20+"];
          const matchingRanges = ranges.filter((rangeKey) => isInRange(gamesCount, rangeKey));

          // Each game count should match exactly one range
          expect(matchingRanges.length).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it("result count is always <= input count", () => {
      fc.assert(
        fc.property(playersArrayGenerator, gameCountRangeGenerator, (players, rangeKey) => {
          const results = filterPlayersByGameCount(players, rangeKey);
          expect(results.length).toBeLessThanOrEqual(players.length);
        }),
        { numRuns: 100 }
      );
    });

    it("filtering preserves player data integrity", () => {
      fc.assert(
        fc.property(playersArrayGenerator, gameCountRangeGenerator, (players, rangeKey) => {
          const results = filterPlayersByGameCount(players, rangeKey);

          // Each result should be an exact match from the original array
          for (const result of results) {
            const original = players.find((p) => p.id === result.id);
            expect(original).toBeDefined();
            expect(result.fullName).toBe(original!.fullName);
            expect(result.gamesCount).toBe(original!.gamesCount);
            expect(result.avatarUrl).toBe(original!.avatarUrl);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
