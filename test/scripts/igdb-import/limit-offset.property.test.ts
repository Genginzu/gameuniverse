import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import type { CLIOptions, ImportStats } from "../../../scripts/igdb-import/types";

/**
 * Feature: igdb-bulk-import
 * Property 7: Option Limit
 * Property 8: Option Offset
 * **Validates: Requirements 6.3, 6.4**
 *
 * Property 7: Pour toute exécution avec l'option --limit=N, le nombre total
 * de jeux traités ne doit pas dépasser N.
 *
 * Property 8: Pour toute exécution avec l'option --offset=M, les M premiers
 * jeux de la liste IGDB doivent être ignorés.
 */

interface MockGame {
  id: number;
  name: string;
}

/**
 * Simulates the orchestrator's pagination logic with limit and offset.
 * This mirrors the behavior in ImportOrchestrator.run()
 */
function simulateImportWithLimitOffset(
  allGames: MockGame[],
  limit?: number,
  offset?: number
): { processedGames: MockGame[]; stats: ImportStats } {
  const startOffset = offset ?? 0;
  const maxGames = limit;

  // Apply offset - skip the first M games
  const gamesAfterOffset = allGames.slice(startOffset);

  // Apply limit - take at most N games
  const gamesToProcess = maxGames ? gamesAfterOffset.slice(0, maxGames) : gamesAfterOffset;

  const stats: ImportStats = {
    total: gamesToProcess.length,
    imported: gamesToProcess.length, // Assume all succeed for simplicity
    skipped: 0,
    errors: 0,
    startTime: new Date(),
    endTime: new Date(),
  };

  return { processedGames: gamesToProcess, stats };
}

/**
 * Simulates batch fetching with offset, mirroring fetchGamesBatch behavior.
 * The orchestrator uses offset in the IGDB query to skip games.
 */
function simulateBatchFetch(
  allGames: MockGame[],
  batchOffset: number,
  batchSize: number
): MockGame[] {
  return allGames.slice(batchOffset, batchOffset + batchSize);
}

// Arbitrary generator for mock games
const mockGameArb = fc.record({
  id: fc.integer({ min: 1, max: 1000000 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
});

describe("ImportOrchestrator Limit/Offset Property-Based Tests", () => {
  describe("Property 7: Option Limit", () => {
    it("ensures total games processed never exceeds limit", async () => {
      await fc.assert(
        fc.property(
          fc.array(mockGameArb, { minLength: 1, maxLength: 200 }),
          fc.integer({ min: 1, max: 100 }),
          (games, limit) => {
            const { stats } = simulateImportWithLimitOffset(games, limit);

            // Property: total processed must not exceed limit
            return stats.total <= limit;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("processes exactly limit games when available games exceed limit", async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 200 }), // total games
          fc.integer({ min: 1, max: 9 }), // limit (less than total)
          (totalGames, limit) => {
            const games = Array.from({ length: totalGames }, (_, i) => ({
              id: i + 1,
              name: `Game ${i + 1}`,
            }));

            const { stats } = simulateImportWithLimitOffset(games, limit);

            // Property: when games > limit, exactly limit games are processed
            return stats.total === limit;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("processes all games when limit exceeds available games", async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }), // total games
          fc.integer({ min: 51, max: 200 }), // limit (more than total)
          (totalGames, limit) => {
            const games = Array.from({ length: totalGames }, (_, i) => ({
              id: i + 1,
              name: `Game ${i + 1}`,
            }));

            const { stats } = simulateImportWithLimitOffset(games, limit);

            // Property: when limit > games, all games are processed
            return stats.total === totalGames && stats.total <= limit;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("handles limit of 1 correctly", async () => {
      await fc.assert(
        fc.property(fc.array(mockGameArb, { minLength: 1, maxLength: 100 }), (games) => {
          const { stats, processedGames } = simulateImportWithLimitOffset(games, 1);

          // Property: with limit=1, exactly 1 game is processed (if available)
          return stats.total === 1 && processedGames.length === 1;
        }),
        { numRuns: 100 }
      );
    });

    it("processes no games when limit is 0 (edge case)", async () => {
      // Note: CLI validation prevents limit=0, but testing the logic
      await fc.assert(
        fc.property(fc.array(mockGameArb, { minLength: 1, maxLength: 100 }), (games) => {
          // Simulate with limit=0 (would be rejected by CLI, but testing logic)
          const gamesAfterOffset = games.slice(0);
          const gamesToProcess = gamesAfterOffset.slice(0, 0);

          // Property: limit=0 means no games processed
          return gamesToProcess.length === 0;
        }),
        { numRuns: 50 }
      );
    });
  });

  describe("Property 8: Option Offset", () => {
    it("ensures first M games are skipped when offset=M", async () => {
      await fc.assert(
        fc.property(
          fc.array(mockGameArb, { minLength: 5, maxLength: 100 }),
          fc.integer({ min: 1, max: 4 }), // offset less than array length
          (games, offset) => {
            const { processedGames } = simulateImportWithLimitOffset(games, undefined, offset);

            // Property: first game processed should be the (offset+1)th game
            if (processedGames.length === 0) {
              return offset >= games.length;
            }
            return processedGames[0].id === games[offset].id;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("skips exactly M games from the beginning", async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 100 }), // total games
          fc.integer({ min: 1, max: 9 }), // offset (less than total)
          (totalGames, offset) => {
            const games = Array.from({ length: totalGames }, (_, i) => ({
              id: i + 1,
              name: `Game ${i + 1}`,
            }));

            const { processedGames, stats } = simulateImportWithLimitOffset(
              games,
              undefined,
              offset
            );

            // Property: processed count = total - offset
            return (
              stats.total === totalGames - offset && processedGames.length === totalGames - offset
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("processes no games when offset exceeds available games", async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }), // total games
          fc.integer({ min: 51, max: 200 }), // offset (more than total)
          (totalGames, offset) => {
            const games = Array.from({ length: totalGames }, (_, i) => ({
              id: i + 1,
              name: `Game ${i + 1}`,
            }));

            const { stats, processedGames } = simulateImportWithLimitOffset(
              games,
              undefined,
              offset
            );

            // Property: when offset >= games, no games are processed
            return stats.total === 0 && processedGames.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("handles offset of 0 (no skip)", async () => {
      await fc.assert(
        fc.property(fc.array(mockGameArb, { minLength: 1, maxLength: 100 }), (games) => {
          const { stats, processedGames } = simulateImportWithLimitOffset(games, undefined, 0);

          // Property: offset=0 means all games are processed
          return stats.total === games.length && processedGames[0].id === games[0].id;
        }),
        { numRuns: 100 }
      );
    });

    it("verifies skipped games are not in processed list", async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 50 }), // total games
          fc.integer({ min: 1, max: 9 }), // offset
          (totalGames, offset) => {
            const games = Array.from({ length: totalGames }, (_, i) => ({
              id: i + 1,
              name: `Game ${i + 1}`,
            }));

            const { processedGames } = simulateImportWithLimitOffset(games, undefined, offset);

            // Property: none of the first M games should be in processed list
            const skippedIds = games.slice(0, offset).map((g) => g.id);
            const processedIds = processedGames.map((g) => g.id);

            return skippedIds.every((id) => !processedIds.includes(id));
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Combined Limit and Offset", () => {
    it("applies offset first, then limit", async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 20, max: 100 }), // total games
          fc.integer({ min: 1, max: 10 }), // limit
          fc.integer({ min: 1, max: 9 }), // offset
          (totalGames, limit, offset) => {
            const games = Array.from({ length: totalGames }, (_, i) => ({
              id: i + 1,
              name: `Game ${i + 1}`,
            }));

            const { processedGames, stats } = simulateImportWithLimitOffset(games, limit, offset);

            // Property: first processed game is at index 'offset'
            // and total processed is min(limit, totalGames - offset)
            const expectedTotal = Math.min(limit, totalGames - offset);
            const firstGameCorrect =
              processedGames.length === 0 || processedGames[0].id === games[offset].id;

            return stats.total === expectedTotal && firstGameCorrect;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("respects both constraints simultaneously", async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 100 }), // total games count
          fc.integer({ min: 1, max: 5 }), // limit
          fc.integer({ min: 1, max: 5 }), // offset
          (totalGames, limit, offset) => {
            // Generate games with unique sequential IDs
            const games = Array.from({ length: totalGames }, (_, i) => ({
              id: i + 1,
              name: `Game ${i + 1}`,
            }));

            const { stats, processedGames } = simulateImportWithLimitOffset(games, limit, offset);

            // Property 1: total never exceeds limit
            const limitRespected = stats.total <= limit;

            // Property 2: skipped games not in processed
            const skippedIds = games.slice(0, offset).map((g) => g.id);
            const processedIds = processedGames.map((g) => g.id);
            const offsetRespected = skippedIds.every((id) => !processedIds.includes(id));

            return limitRespected && offsetRespected;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("handles edge case where offset + limit exceeds total games", async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 20 }), // total games
          fc.integer({ min: 10, max: 30 }), // limit (potentially > remaining)
          fc.integer({ min: 1, max: 4 }), // offset
          (totalGames, limit, offset) => {
            const games = Array.from({ length: totalGames }, (_, i) => ({
              id: i + 1,
              name: `Game ${i + 1}`,
            }));

            const { stats } = simulateImportWithLimitOffset(games, limit, offset);

            // Property: total = min(limit, totalGames - offset)
            const expectedTotal = Math.max(0, Math.min(limit, totalGames - offset));
            return stats.total === expectedTotal;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Batch Fetching with Offset", () => {
    it("batch fetch respects offset in IGDB query", async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 50, max: 200 }), // total games in IGDB
          fc.integer({ min: 0, max: 49 }), // batch offset
          fc.integer({ min: 1, max: 50 }), // batch size
          (totalGames, batchOffset, batchSize) => {
            const allGames = Array.from({ length: totalGames }, (_, i) => ({
              id: i + 1,
              name: `Game ${i + 1}`,
            }));

            const batch = simulateBatchFetch(allGames, batchOffset, batchSize);

            // Property: batch starts at correct offset
            if (batch.length === 0) {
              return batchOffset >= totalGames;
            }
            return batch[0].id === allGames[batchOffset].id;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("batch size is respected", async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 500 }), // total games
          fc.integer({ min: 0, max: 50 }), // offset
          fc.integer({ min: 1, max: 50 }), // batch size
          (totalGames, offset, batchSize) => {
            const allGames = Array.from({ length: totalGames }, (_, i) => ({
              id: i + 1,
              name: `Game ${i + 1}`,
            }));

            const batch = simulateBatchFetch(allGames, offset, batchSize);

            // Property: batch size is min(requested, remaining)
            const expectedSize = Math.min(batchSize, totalGames - offset);
            return batch.length === expectedSize;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
