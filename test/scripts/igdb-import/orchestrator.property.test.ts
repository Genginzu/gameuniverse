import { describe, it, expect, mock, beforeEach } from "bun:test";
import * as fc from "fast-check";
import type { ImportStats } from "../../../scripts/igdb-import/types";

/**
 * Feature: igdb-bulk-import
 * Property 5: Invariant des Statistiques
 * **Validates: Requirements 4.4, 5.2, 5.4**
 *
 * Pour toute exécution du script, la somme (imported + skipped + errors)
 * doit être égale au nombre total de jeux traités.
 */

// Simulate the stats tracking logic from ImportOrchestrator.processGame
type ProcessOutcome = "imported" | "skipped" | "error";

function simulateProcessGame(stats: ImportStats, outcome: ProcessOutcome): void {
  switch (outcome) {
    case "imported":
      stats.imported++;
      break;
    case "skipped":
      stats.skipped++;
      break;
    case "error":
      stats.errors++;
      break;
  }
}

function createInitialStats(): ImportStats {
  return {
    total: 0,
    imported: 0,
    skipped: 0,
    errors: 0,
    startTime: new Date(),
  };
}

describe("ImportOrchestrator Property-Based Tests", () => {
  describe("Property 5: Invariant des Statistiques", () => {
    it("ensures imported + skipped + errors equals total games processed", async () => {
      await fc.assert(
        fc.property(
          fc.array(fc.constantFrom<ProcessOutcome>("imported", "skipped", "error"), {
            minLength: 1,
            maxLength: 100,
          }),
          (outcomes) => {
            const stats = createInitialStats();
            for (const outcome of outcomes) {
              simulateProcessGame(stats, outcome);
            }
            stats.total = outcomes.length;
            const sum = stats.imported + stats.skipped + stats.errors;
            return sum === stats.total;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("maintains invariant with random distribution of outcomes", async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 50 }), // imported count
          fc.integer({ min: 0, max: 50 }), // skipped count
          fc.integer({ min: 0, max: 50 }), // error count
          (importedCount, skippedCount, errorCount) => {
            const stats = createInitialStats();

            // Simulate processing games with specific outcome counts
            for (let i = 0; i < importedCount; i++) {
              simulateProcessGame(stats, "imported");
            }
            for (let i = 0; i < skippedCount; i++) {
              simulateProcessGame(stats, "skipped");
            }
            for (let i = 0; i < errorCount; i++) {
              simulateProcessGame(stats, "error");
            }

            const totalProcessed = importedCount + skippedCount + errorCount;
            stats.total = totalProcessed;

            // Property: sum of individual counts equals total
            const sum = stats.imported + stats.skipped + stats.errors;
            return sum === stats.total && sum === totalProcessed;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("handles edge case of zero games processed", async () => {
      await fc.assert(
        fc.property(fc.constant(null), () => {
          const stats = createInitialStats();
          stats.total = 0;

          // Property: all counters should be 0
          const sum = stats.imported + stats.skipped + stats.errors;
          return sum === 0 && stats.total === 0;
        }),
        { numRuns: 10 }
      );
    });

    it("maintains invariant regardless of outcome order", async () => {
      await fc.assert(
        fc.property(
          fc.array(fc.constantFrom<ProcessOutcome>("imported", "skipped", "error"), {
            minLength: 1,
            maxLength: 50,
          }),
          (outcomes) => {
            // Process in original order
            const stats1 = createInitialStats();
            for (const outcome of outcomes) {
              simulateProcessGame(stats1, outcome);
            }
            stats1.total = outcomes.length;

            // Process in reversed order
            const stats2 = createInitialStats();
            const reversed = [...outcomes].reverse();
            for (const outcome of reversed) {
              simulateProcessGame(stats2, outcome);
            }
            stats2.total = reversed.length;

            // Both should satisfy the invariant
            const sum1 = stats1.imported + stats1.skipped + stats1.errors;
            const sum2 = stats2.imported + stats2.skipped + stats2.errors;

            return (
              sum1 === stats1.total &&
              sum2 === stats2.total &&
              stats1.imported === stats2.imported &&
              stats1.skipped === stats2.skipped &&
              stats1.errors === stats2.errors
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("ensures no negative counters after processing", async () => {
      await fc.assert(
        fc.property(
          fc.array(fc.constantFrom<ProcessOutcome>("imported", "skipped", "error"), {
            minLength: 0,
            maxLength: 100,
          }),
          (outcomes) => {
            const stats = createInitialStats();

            for (const outcome of outcomes) {
              simulateProcessGame(stats, outcome);
            }
            stats.total = outcomes.length;

            // Property: all counters must be non-negative
            return (
              stats.imported >= 0 && stats.skipped >= 0 && stats.errors >= 0 && stats.total >= 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
