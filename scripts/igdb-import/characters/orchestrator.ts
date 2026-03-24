/**
 * Character Import Orchestrator — coordinates bulk character import from IGDB.
 * Follows the same pattern as the game ImportOrchestrator but is fully independent.
 */

import { IGDBService } from "../../../src/lib/services/igdbService";
import { RateLimiter } from "../shared/rate-limiter";
import { withRetry } from "../shared/retry";
import { ProgressTracker } from "../shared/progress-tracker";
import { importCharacterFromIGDB } from "./character-importer";
import type { IGDBCharacter } from "../../../src/types/igdb";
import type { CharacterCLIOptions } from "./index";
import type { ImportStats } from "../shared/types";

const BATCH_SIZE = 500;

export class CharacterOrchestrator {
  private stats: ImportStats;
  private rateLimiter: RateLimiter;
  private options: CharacterCLIOptions;
  private currentOffset: number = 0;
  private isInterrupted: boolean = false;
  private progressTracker: ProgressTracker | null = null;

  constructor(options: CharacterCLIOptions) {
    this.options = options;
    this.rateLimiter = new RateLimiter(4, 1000);
    this.stats = {
      total: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
      startTime: new Date(),
    };
  }

  setupSignalHandlers(): void {
    const handleSignal = (signal: string) => {
      console.log(`\n[CharImport] Received ${signal}, shutting down...`);
      this.isInterrupted = true;
    };
    process.on("SIGINT", () => handleSignal("SIGINT"));
    process.on("SIGTERM", () => handleSignal("SIGTERM"));
  }

  /**
   * Fetch total character count from IGDB for progress tracking.
   */
  private async fetchTotalCount(): Promise<number> {
    await this.rateLimiter.throttle();

    try {
      const result = await withRetry(() => IGDBService.getCharactersCount(), {
        maxAttempts: 3,
        initialDelayMs: 1000,
        verbose: this.options.verbose,
        operationName: "fetchCharacterCount",
      });
      return result.value;
    } catch {
      return 0;
    }
  }

  /**
   * Fetch a batch of characters from IGDB with rate limiting and retry.
   */
  private async fetchBatch(offset: number, limit: number): Promise<IGDBCharacter[]> {
    await this.rateLimiter.throttle();

    const result = await withRetry(
      () => IGDBService.getCharactersBatch(offset, Math.min(limit, BATCH_SIZE)),
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
        verbose: this.options.verbose,
        operationName: `fetchCharactersBatch(offset=${offset}, limit=${limit})`,
      }
    );

    if (this.options.verbose) {
      console.log(`[Fetch] Retrieved ${result.value.length} characters from offset ${offset}`);
    }

    return result.value;
  }

  /**
   * Process a single character: import or dry-run log.
   */
  private async processCharacter(character: IGDBCharacter): Promise<void> {
    try {
      if (this.options.dryRun) {
        const gender = character.character_gender?.name ?? "unknown";
        const species = character.character_species?.name ?? "unknown";
        const gameCount = character.games?.length ?? 0;

        console.log(
          `[Dry-run] Would import: "${character.name}" (IGDB ID: ${character.id}, Gender: ${gender}, Species: ${species}, Games: ${gameCount})`
        );
        this.stats.skipped++;
        return;
      }

      const result = await importCharacterFromIGDB(character, this.options.verbose);

      if (result.success) {
        if (result.skipped) {
          this.stats.skipped++;
        } else {
          this.stats.imported++;
        }
      } else {
        this.stats.errors++;
        console.error(
          `[Error] Failed to import ${character.name} (IGDB ID: ${character.id}): ${result.error}`
        );
      }
    } catch (error) {
      this.stats.errors++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        `[Error] Unexpected error importing ${character.name} (IGDB ID: ${character.id}): ${errorMessage}`
      );
    }
  }

  /**
   * Run the bulk character import process with pagination and progress tracking.
   */
  async run(): Promise<ImportStats> {
    this.stats.startTime = new Date();

    const startOffset = this.options.offset ?? 0;
    this.currentOffset = startOffset;
    const maxCharacters = this.options.limit;
    let totalProcessed = 0;

    console.log(`[CharImport] Starting bulk character import from IGDB...`);
    console.log(`[CharImport] Mode: ${this.options.dryRun ? "DRY-RUN" : "LIVE"}`);
    if (maxCharacters) console.log(`[CharImport] Limit: ${maxCharacters} characters`);
    if (startOffset > 0) console.log(`[CharImport] Starting from offset: ${startOffset}`);

    // Initialize progress tracker
    if (!this.options.verbose) {
      console.log(`[CharImport] Fetching total character count...`);
      const estimatedTotal = await this.fetchTotalCount();

      const effectiveTotal = maxCharacters
        ? Math.min(estimatedTotal - startOffset, maxCharacters)
        : estimatedTotal - startOffset;

      if (estimatedTotal > 0) {
        console.log(`[CharImport] Found ${estimatedTotal} characters in IGDB`);
      }

      this.progressTracker = new ProgressTracker(Math.max(effectiveTotal, 1), 500);
      console.log(`\n`);
    }

    try {
      while (!this.isInterrupted) {
        const remaining = maxCharacters ? maxCharacters - totalProcessed : BATCH_SIZE;
        const batchSize = Math.min(remaining, BATCH_SIZE);

        if (batchSize <= 0) break;

        const characters = await this.fetchBatch(this.currentOffset, batchSize);

        if (characters.length === 0) {
          if (this.options.verbose) {
            console.log(`[CharImport] No more characters at offset ${this.currentOffset}`);
          }
          break;
        }

        for (const character of characters) {
          if (this.isInterrupted) break;
          if (maxCharacters && totalProcessed >= maxCharacters) break;

          await this.processCharacter(character);
          totalProcessed++;
          this.stats.total = totalProcessed;

          if (this.progressTracker && !this.options.verbose) {
            this.progressTracker.update(totalProcessed, {
              imported: this.stats.imported,
              skipped: this.stats.skipped,
              errors: this.stats.errors,
            });
          } else if (this.options.verbose && totalProcessed % 10 === 0) {
            console.log(
              `[Progress] Processed ${totalProcessed} — Imported: ${this.stats.imported}, Skipped: ${this.stats.skipped}, Errors: ${this.stats.errors}`
            );
          }
        }

        if (this.isInterrupted || (maxCharacters && totalProcessed >= maxCharacters)) break;

        this.currentOffset += characters.length;

        if (characters.length < batchSize) break;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[CharImport] Fatal error: ${errorMessage}`);
    }

    // Finalize
    this.stats.endTime = new Date();
    this.stats.total = totalProcessed;

    this.printSummary();

    return this.stats;
  }

  private printSummary(): void {
    const duration = (this.stats.endTime!.getTime() - this.stats.startTime.getTime()) / 1000;
    const minutes = Math.floor(duration / 60);
    const seconds = Math.round(duration % 60);

    if (this.progressTracker && !this.options.verbose) {
      this.progressTracker.finish(this.stats);
    } else {
      console.log(`\n[CharImport] ========== IMPORT COMPLETE ==========`);
      console.log(`[CharImport] Total processed: ${this.stats.total}`);
      console.log(`[CharImport] Imported: ${this.stats.imported}`);
      console.log(`[CharImport] Skipped (existing): ${this.stats.skipped}`);
      console.log(`[CharImport] Errors: ${this.stats.errors}`);
      console.log(`[CharImport] Duration: ${minutes}m ${seconds}s`);
      console.log(`[CharImport] ==========================================\n`);
    }
  }
}
