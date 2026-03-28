/**
 * Import Orchestrator - coordinates the bulk import process
 * Requirements: 2.1, 2.2, 2.3, 3.1-3.8, 4.1, 4.3, 6.2
 */

import { importGameFromIGDB } from "./game-importer";
import type { IGDBGame } from "../../../src/types/igdb";
import type { CLIOptions, ImportStats } from "../shared/types";
import { RateLimiter } from "../shared/rate-limiter";
import { ProgressTracker } from "../shared/progress-tracker";
import { fetchTotalCount, fetchGamesBatch, isNotableGame, BATCH_SIZE } from "./igdb-fetcher";
import { downloadGameDumps } from "../shared/dump-downloader";
import { assembleGamesFromDumps } from "./dump-assembler";
import { generateGamesSql } from "./sql-generator";
import { join } from "path";

/**
 * Orchestrates the bulk import of games from IGDB to Supabase.
 * Handles pagination, rate limiting, error recovery, and progress tracking.
 */
export class ImportOrchestrator {
  private stats: ImportStats;
  private rateLimiter: RateLimiter;
  private options: CLIOptions;
  private currentOffset: number = 0;
  private isInterrupted: boolean = false;
  private progressTracker: ProgressTracker | null = null;
  private estimatedTotal: number = 0;

  constructor(options: CLIOptions) {
    this.options = options;
    this.rateLimiter = new RateLimiter(4, 1000); // 4 requests per second
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
      console.log(`\n[Import] Received ${signal}, shutting down...`);
      this.isInterrupted = true;
    };
    process.on("SIGINT", () => handleSignal("SIGINT"));
    process.on("SIGTERM", () => handleSignal("SIGTERM"));
  }

  /** Process a single game: import or dry-run log. */
  async processGame(game: IGDBGame, dryRun: boolean): Promise<void> {
    try {
      if (dryRun) {
        const date = game.first_release_date
          ? new Date(game.first_release_date * 1000).toISOString().split("T")[0]
          : "unknown";
        console.log(`[Dry-run] Would import: "${game.name}" (IGDB ${game.id}, ${date})`);
        this.stats.skipped++;
        return;
      }

      const result = await importGameFromIGDB(game, this.options.verbose, this.options.dryRun);
      if (result.success) {
        this.stats.imported++;
        if (this.options.verbose) {
          console.log(
            `[Import] ${result.synced ? "Synced" : "Imported"}: ${game.name} (IGDB ${game.id})`
          );
        }
      } else {
        this.stats.errors++;
        console.error(`[Error] ${game.name} (IGDB ${game.id}): ${result.error}`);
      }
    } catch (error) {
      this.stats.errors++;
      console.error(
        `[Error] ${game.name} (IGDB ${game.id}): ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /** Update progress display after processing a game */
  private updateProgress(totalProcessed: number): void {
    if (this.progressTracker && !this.options.verbose) {
      this.progressTracker.update(totalProcessed, {
        imported: this.stats.imported,
        skipped: this.stats.skipped,
        errors: this.stats.errors,
      });
    } else if (this.options.verbose && totalProcessed % 10 === 0) {
      console.log(
        `[Progress] Processed ${totalProcessed} games - ` +
          `Imported: ${this.stats.imported}, Skipped: ${this.stats.skipped}, Errors: ${this.stats.errors}`
      );
    }
  }

  /** Print startup banner with current configuration */
  private logStartup(startOffset: number, maxGames?: number): void {
    const isDump = this.options.source === "dump";
    console.log(`[Import] Starting bulk import from ${isDump ? "IGDB data dumps" : "IGDB API"}...`);
    console.log(`[Import] Mode: ${this.options.dryRun ? "DRY-RUN (no database writes)" : "LIVE"}`);
    console.log(`[Import] Source: ${isDump ? "dump" : "api"}`);
    if (isDump)
      console.log(
        `[Import] Dumps directory: ${this.options.dumpFile ?? "scripts/igdb-import/dumps"}`
      );
    if (this.options.notableOnly) {
      console.log(`[Import] Filter: Notable games only (with ratings, hypes, or follows)`);
    } else if (this.options.notNotable) {
      console.log(`[Import] Filter: Non-notable games only (without ratings, hypes, or follows)`);
    }
    if (!isDump) {
      console.log(
        `[Import] Date range: ${this.options.fromDate.toISOString().split("T")[0]} to ${this.options.toDate.toISOString().split("T")[0]}`
      );
    }
    if (maxGames) console.log(`[Import] Limit: ${maxGames} games`);
    if (startOffset > 0) console.log(`[Import] Starting from offset: ${startOffset}`);
  }

  /** Print final summary after import completes */
  private logSummary(): void {
    if (this.progressTracker && !this.options.verbose) {
      this.progressTracker.finish(this.stats);
      return;
    }
    const durationSec = (this.stats.endTime!.getTime() - this.stats.startTime.getTime()) / 1000;
    console.log(`\n[Import] ========== IMPORT COMPLETE ==========`);
    console.log(
      `[Import] Total: ${this.stats.total} | Imported: ${this.stats.imported} | Skipped: ${this.stats.skipped} | Errors: ${this.stats.errors}`
    );
    console.log(
      `[Import] Duration: ${Math.floor(durationSec / 60)}m ${Math.round(durationSec % 60)}s`
    );
    console.log(`[Import] ==========================================\n`);
  }

  /**
   * Run the bulk import process.
   * Delegates to API or dump mode based on CLI options.
   */
  async run(): Promise<ImportStats> {
    this.stats.startTime = new Date();

    const startOffset = this.options.offset ?? 0;
    this.currentOffset = startOffset;
    const maxGames = this.options.limit;

    this.logStartup(startOffset, maxGames);

    if (this.options.source === "dump") {
      // Dump mode: download CSVs → assemble → generate SQL file
      const dumpsDir = this.options.dumpFile ?? "scripts/igdb-import/dumps";
      const csvPaths = await downloadGameDumps(dumpsDir, this.options.verbose);

      if (!csvPaths.has("games")) {
        throw new Error("Failed to download the games dump — cannot proceed.");
      }

      let allGames = await assembleGamesFromDumps(csvPaths, this.options.verbose);

      // Apply date range filter (--from / --to)
      const fromTs = Math.floor(this.options.fromDate.getTime() / 1000);
      const toTs = Math.floor(this.options.toDate.getTime() / 1000);
      const beforeDate = allGames.length;
      allGames = allGames.filter((g) => {
        if (!g.first_release_date) return false;
        return g.first_release_date >= fromTs && g.first_release_date <= toTs;
      });
      console.log(
        `[Import] Date filter (${this.options.fromDate.toISOString().split("T")[0]} → ${this.options.toDate.toISOString().split("T")[0]}): ${beforeDate} → ${allGames.length} games`
      );

      // Apply notable filters
      if (this.options.notableOnly) {
        const before = allGames.length;
        allGames = allGames.filter((g) => isNotableGame(g, true));
        console.log(`[Import] Notable filter: ${before} → ${allGames.length} games`);
      } else if (this.options.notNotable) {
        const before = allGames.length;
        allGames = allGames.filter((g) => !isNotableGame(g, true));
        console.log(`[Import] Not-notable filter: ${before} → ${allGames.length} games`);
      }

      // Apply offset and limit
      if (startOffset > 0) allGames = allGames.slice(startOffset);
      if (maxGames) allGames = allGames.slice(0, maxGames);

      const sqlDir = join(dumpsDir, "sqls");
      const fromStr = this.options.fromDate.toISOString().split("T")[0];
      const toStr = this.options.toDate.toISOString().split("T")[0];
      const notable = this.options.notableOnly
        ? "_notable"
        : this.options.notNotable
          ? "_not-notable"
          : "";
      const sqlPath = join(sqlDir, `import-games_${fromStr}_${toStr}${notable}.sql`);
      await generateGamesSql(allGames, sqlPath, this.options.verbose);

      this.stats.endTime = new Date();
      this.stats.total = allGames.length;
      this.stats.imported = allGames.length;

      console.log(`\n[Import] SQL file generated: ${sqlPath}`);
      console.log(`[Import] Execute it in Supabase SQL editor to import ${allGames.length} games.`);
      console.log(`[Import] Then run the API mode to sync colors, versions, DLC, and playtime.\n`);

      return this.stats;
    }

    // API mode: paginated import via IGDB API
    await this.initApiProgressTracker(startOffset, maxGames);
    const getBatch = async (offset: number, limit: number) =>
      fetchGamesBatch(this.options, this.rateLimiter, offset, limit);

    const totalProcessed = await this.runPaginatedLoop(getBatch, maxGames);

    this.stats.endTime = new Date();
    this.stats.total = totalProcessed;
    this.logSummary();

    return this.stats;
  }

  /** Initialize progress tracker for API mode (needs a count API call) */
  private async initApiProgressTracker(startOffset: number, maxGames?: number): Promise<void> {
    if (this.options.verbose) return;
    console.log(`[Import] Fetching total game count...`);
    this.estimatedTotal = await fetchTotalCount(this.options, this.rateLimiter);
    const effectiveTotal = maxGames
      ? Math.min(this.estimatedTotal - startOffset, maxGames)
      : this.estimatedTotal - startOffset;
    if (this.estimatedTotal > 0) {
      console.log(`[Import] Found ${this.estimatedTotal} games in date range`);
      if (startOffset > 0)
        console.log(`[Import] Will process ~${effectiveTotal} games (after offset)`);
    }
    this.progressTracker = new ProgressTracker(Math.max(effectiveTotal, 1), 500);
    console.log(`\n`);
  }

  /** Initialize progress tracker from a known total (dump mode) */
  private initProgressTracker(
    total: number,
    startOffset: number,
    maxGames?: number,
    label?: string
  ): void {
    if (this.options.verbose) return;
    if (label) console.log(`[Import] ${label}`);
    const effectiveTotal = maxGames ? Math.min(total - startOffset, maxGames) : total - startOffset;
    this.progressTracker = new ProgressTracker(Math.max(effectiveTotal, 1), 500);
    console.log(`\n`);
  }

  /**
   * Generic paginated import loop. Works with both API and dump batch providers.
   */
  private async runPaginatedLoop(
    getBatch: (offset: number, limit: number) => Promise<IGDBGame[] | null>,
    maxGames?: number
  ): Promise<number> {
    let totalProcessed = 0;
    try {
      while (!this.isInterrupted) {
        const remainingGames = maxGames ? maxGames - totalProcessed : BATCH_SIZE;
        const batchSize = Math.min(remainingGames, BATCH_SIZE);
        if (batchSize <= 0) break;

        const games = await getBatch(this.currentOffset, batchSize);
        if (games === null) continue; // transient error, retry same offset
        if (games.length === 0) break;

        totalProcessed = await this.processBatch(games, totalProcessed, maxGames);
        if (this.isInterrupted || (maxGames && totalProcessed >= maxGames)) break;
        this.currentOffset += games.length;
        if (games.length < batchSize) break;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Import] Fatal error during import: ${errorMessage}`);
    }
    return totalProcessed;
  }

  /**
   * Process a batch of games sequentially (shared between API and dump modes).
   * Returns the updated totalProcessed count.
   */
  private async processBatch(
    games: IGDBGame[],
    totalProcessed: number,
    maxGames?: number
  ): Promise<number> {
    for (const game of games) {
      if (this.isInterrupted) break;
      if (maxGames && totalProcessed >= maxGames) break;

      if (!isNotableGame(game, this.options.notableOnly)) {
        this.stats.skipped++;
        totalProcessed++;
        this.stats.total = totalProcessed;
        if (this.options.verbose) {
          console.log(`[Import] Skipped (not notable): ${game.name} (IGDB ID: ${game.id})`);
        }
        this.updateProgress(totalProcessed);
        continue;
      }

      await this.processGame(game, this.options.dryRun);
      totalProcessed++;
      this.stats.total = totalProcessed;
      this.updateProgress(totalProcessed);
    }
    return totalProcessed;
  }
}

// Re-export for convenience
export type { IGDBGame };
