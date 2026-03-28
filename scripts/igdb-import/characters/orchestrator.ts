/**
 * Character Import Orchestrator — coordinates bulk character import from IGDB.
 * Supports both API and dump file sources.
 */

import { IGDBService } from "../../../src/lib/services/igdbService";
import { RateLimiter } from "../shared/rate-limiter";
import { withRetry } from "../shared/retry";
import { ProgressTracker } from "../shared/progress-tracker";
import { importCharacterFromIGDB } from "./character-importer";
import { DumpReader } from "../shared/dump-reader";
import { downloadCharacterDumps } from "../shared/dump-downloader";
import { assembleCharactersFromDumps } from "./dump-assembler";
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

  /** Fetch total character count from IGDB for progress tracking. */
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

  /** Fetch a batch of characters from IGDB. Returns null on transient failure. */
  private async fetchBatch(offset: number, limit: number): Promise<IGDBCharacter[] | null> {
    await this.rateLimiter.throttle();
    try {
      const result = await withRetry(
        () => IGDBService.getCharactersBatch(offset, Math.min(limit, BATCH_SIZE)),
        {
          maxAttempts: 5,
          initialDelayMs: 2000,
          verbose: this.options.verbose,
          operationName: `fetchCharactersBatch(offset=${offset}, limit=${limit})`,
        }
      );
      if (this.options.verbose) {
        console.log(`[Fetch] Retrieved ${result.value.length} characters from offset ${offset}`);
      }
      return result.value;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[CharImport] fetchBatch failed at offset ${offset}: ${msg}`);
      console.error(`[CharImport] Waiting 10s before continuing...`);
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      return null;
    }
  }

  /** Process a single character: import or dry-run log. */
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
        this.stats.imported++;
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

  /** Run the bulk character import. Delegates to API or dump based on options. */
  async run(): Promise<ImportStats> {
    this.stats.startTime = new Date();

    const startOffset = this.options.offset ?? 0;
    this.currentOffset = startOffset;
    const maxItems = this.options.limit;

    this.logStartup(startOffset, maxItems);

    // Build the batch provider based on source
    let getBatch: (offset: number, limit: number) => Promise<IGDBCharacter[] | null>;

    if (this.options.source === "dump") {
      const dumpsDir = this.options.dumpFile ?? "scripts/igdb-import/dumps";
      const csvPaths = await downloadCharacterDumps(dumpsDir, this.options.verbose);

      if (!csvPaths.has("characters")) {
        throw new Error("Failed to download the characters dump — cannot proceed.");
      }

      const allCharacters = await assembleCharactersFromDumps(csvPaths, this.options.verbose);
      const reader = new DumpReader<IGDBCharacter>("", this.options.verbose);
      reader.loadFromArray(allCharacters);

      this.initProgress(reader.getTotalCount(), startOffset, maxItems);
      getBatch = async (offset, limit) => reader.readBatch(offset, limit);
    } else {
      await this.initApiProgress(startOffset, maxItems);
      getBatch = async (offset, limit) => this.fetchBatch(offset, limit);
    }

    const totalProcessed = await this.runPaginatedLoop(getBatch, maxItems);

    this.stats.endTime = new Date();
    this.stats.total = totalProcessed;
    this.printSummary();
    return this.stats;
  }

  private logStartup(startOffset: number, maxItems?: number): void {
    const isDump = this.options.source === "dump";
    console.log(
      `[CharImport] Starting bulk character import from ${isDump ? "IGDB data dumps" : "IGDB API"}...`
    );
    console.log(`[CharImport] Mode: ${this.options.dryRun ? "DRY-RUN" : "LIVE"}`);
    if (isDump)
      console.log(
        `[CharImport] Dumps directory: ${this.options.dumpFile ?? "scripts/igdb-import/dumps"}`
      );
    console.log(`[CharImport] Source: ${isDump ? "dump" : "api"}`);
    if (maxItems) console.log(`[CharImport] Limit: ${maxItems} characters`);
    if (startOffset > 0) console.log(`[CharImport] Starting from offset: ${startOffset}`);
  }

  private async initApiProgress(startOffset: number, maxItems?: number): Promise<void> {
    if (this.options.verbose) return;
    console.log(`[CharImport] Fetching total character count...`);
    const total = await this.fetchTotalCount();
    const effective = maxItems ? Math.min(total - startOffset, maxItems) : total - startOffset;
    if (total > 0) console.log(`[CharImport] Found ${total} characters in IGDB`);
    this.progressTracker = new ProgressTracker(Math.max(effective, 1), 500);
    console.log(`\n`);
  }

  private initProgress(total: number, startOffset: number, maxItems?: number): void {
    if (this.options.verbose) return;
    console.log(`[CharImport] Dump contains ${total} characters`);
    const effective = maxItems ? Math.min(total - startOffset, maxItems) : total - startOffset;
    this.progressTracker = new ProgressTracker(Math.max(effective, 1), 500);
    console.log(`\n`);
  }

  /** Generic paginated loop shared between API and dump modes. */
  private async runPaginatedLoop(
    getBatch: (offset: number, limit: number) => Promise<IGDBCharacter[] | null>,
    maxItems?: number
  ): Promise<number> {
    let totalProcessed = 0;

    try {
      while (!this.isInterrupted) {
        const remaining = maxItems ? maxItems - totalProcessed : BATCH_SIZE;
        const batchSize = Math.min(remaining, BATCH_SIZE);
        if (batchSize <= 0) break;

        const characters = await getBatch(this.currentOffset, batchSize);
        if (characters === null) continue; // transient error, retry
        if (characters.length === 0) break;

        for (const character of characters) {
          if (this.isInterrupted || (maxItems && totalProcessed >= maxItems)) break;

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

        if (this.isInterrupted || (maxItems && totalProcessed >= maxItems)) break;
        this.currentOffset += characters.length;
        if (characters.length < batchSize) break;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[CharImport] Fatal error: ${errorMessage}`);
    }

    return totalProcessed;
  }

  private printSummary(): void {
    if (this.progressTracker && !this.options.verbose) {
      this.progressTracker.finish(this.stats);
      return;
    }
    const duration = (this.stats.endTime!.getTime() - this.stats.startTime.getTime()) / 1000;
    const minutes = Math.floor(duration / 60);
    const seconds = Math.round(duration % 60);

    console.log(`\n[CharImport] ========== IMPORT COMPLETE ==========`);
    console.log(`[CharImport] Total processed: ${this.stats.total}`);
    console.log(`[CharImport] Imported: ${this.stats.imported}`);
    console.log(`[CharImport] Skipped (existing): ${this.stats.skipped}`);
    console.log(`[CharImport] Errors: ${this.stats.errors}`);
    console.log(`[CharImport] Duration: ${minutes}m ${seconds}s`);
    console.log(`[CharImport] ==========================================\n`);
  }
}
