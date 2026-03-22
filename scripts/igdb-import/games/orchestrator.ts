/**
 * Import Orchestrator - coordinates the bulk import process
 * Requirements: 2.1, 2.2, 2.3, 3.1-3.8, 4.1, 4.3, 6.2
 */

import { IGDBService } from "../../../src/lib/services/igdbService";
import { importGameFromIGDB } from "./game-importer";
import type { IGDBGame } from "../../../src/types/igdb";
import type { CLIOptions, ImportStats } from "../shared/types";
import { RateLimiter } from "../shared/rate-limiter";
import { withRetry } from "../shared/retry";
import { ProgressTracker } from "../shared/progress-tracker";

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

  // IGDB API constants
  private static readonly IGDB_API_URL = "https://api.igdb.com/v4";
  private static readonly BATCH_SIZE = 500; // Max allowed by IGDB

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

  /**
   * Set up signal handlers for graceful shutdown.
   * Captures SIGINT (Ctrl+C) and SIGTERM to stop the import cleanly.
   */
  setupSignalHandlers(): void {
    const handleSignal = (signal: string) => {
      console.log(`\n[Import] Received ${signal}, shutting down...`);
      this.isInterrupted = true;
    };

    process.on("SIGINT", () => handleSignal("SIGINT"));
    process.on("SIGTERM", () => handleSignal("SIGTERM"));
  }

  /**
   * Mark the import as interrupted (for testing purposes)
   */
  interrupt(): void {
    this.isInterrupted = true;
  }

  /**
   * Check if the import has been interrupted
   */
  wasInterrupted(): boolean {
    return this.isInterrupted;
  }

  /**
   * Fetch the total count of games matching the date range.
   * Used to initialize the progress bar with an accurate estimate.
   *
   * @returns Estimated total number of games
   */
  async fetchTotalCount(): Promise<number> {
    const timestampFrom = Math.floor(this.options.fromDate.getTime() / 1000);
    const timestampTo = Math.floor(this.options.toDate.getTime() / 1000);

    const query = `
      fields id;
      where first_release_date >= ${timestampFrom} & first_release_date <= ${timestampTo};
      limit 1;
    `;

    await this.rateLimiter.throttle();

    try {
      const result = await withRetry(
        async () => {
          const accessToken = await IGDBService.getAccessToken();
          const clientId = process.env.IGDB_CLIENT_ID;

          if (!clientId) {
            throw new Error("IGDB_CLIENT_ID not configured");
          }

          // Use the count endpoint to get total
          const response = await fetch(`${ImportOrchestrator.IGDB_API_URL}/games/count`, {
            method: "POST",
            headers: {
              "Client-ID": clientId,
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "text/plain",
            },
            body: query,
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`IGDB count failed: ${response.status} - ${errorText}`);
          }

          const data = (await response.json()) as { count: number };
          return data.count;
        },
        {
          maxAttempts: 3,
          initialDelayMs: 1000,
          verbose: this.options.verbose,
          operationName: "fetchTotalCount",
        }
      );

      return result.value;
    } catch {
      // If count fails, return 0 (progress bar will show "calculating...")
      return 0;
    }
  }

  /**
   * Fetch a batch of games from IGDB API.
   * Filters games by the date range specified in CLI options.
   * Uses rate limiting and retry logic for resilience.
   *
   * Requirements: 2.1, 2.2, 2.3
   *
   * @param offset The offset for pagination
   * @param limit The maximum number of games to fetch in this batch
   * @returns Array of IGDB games
   */
  async fetchGamesBatch(offset: number, limit: number): Promise<IGDBGame[]> {
    // Use the date range from CLI options
    const timestampFrom = Math.floor(this.options.fromDate.getTime() / 1000);
    const timestampTo = Math.floor(this.options.toDate.getTime() / 1000);

    // Build the IGDB query with all required fields
    const query = `
      fields name, slug, summary, storyline, first_release_date, aggregated_rating,
             cover.image_id,
             screenshots.image_id,
             artworks.image_id,
             genres.id, genres.name, genres.slug,
             involved_companies.company.id, involved_companies.company.name, involved_companies.company.slug,
             involved_companies.developer, involved_companies.publisher,
             language_supports.language.id, language_supports.language.name, language_supports.language.native_name, language_supports.language.locale,
             language_supports.language_support_type.id, language_supports.language_support_type.name,
             age_ratings.id, age_ratings.organization, age_ratings.rating_category, age_ratings.synopsis,
             age_ratings.rating_content_descriptions,
             videos.video_id, videos.name;
      where first_release_date >= ${timestampFrom} & first_release_date <= ${timestampTo};
      sort first_release_date desc;
      limit ${Math.min(limit, ImportOrchestrator.BATCH_SIZE)};
      offset ${offset};
    `;

    // Apply rate limiting before making the request
    await this.rateLimiter.throttle();

    // Execute with retry logic for resilience
    const result = await withRetry(
      async () => {
        const accessToken = await IGDBService.getAccessToken();
        const clientId = process.env.IGDB_CLIENT_ID;

        if (!clientId) {
          throw new Error("IGDB_CLIENT_ID not configured");
        }

        const response = await fetch(`${ImportOrchestrator.IGDB_API_URL}/games`, {
          method: "POST",
          headers: {
            "Client-ID": clientId,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "text/plain",
          },
          body: query,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `IGDB fetchGamesBatch failed: ${response.status} ${response.statusText} - ${errorText}`
          );
        }

        return response.json() as Promise<IGDBGame[]>;
      },
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
        verbose: this.options.verbose,
        operationName: `fetchGamesBatch(offset=${offset}, limit=${limit})`,
      }
    );

    if (this.options.verbose) {
      console.log(`[Fetch] Retrieved ${result.value.length} games from offset ${offset}`);
    }

    return result.value;
  }

  /**
   * Get the current import statistics
   */
  getStats(): ImportStats {
    return { ...this.stats };
  }

  /**
   * Process a single game from IGDB.
   * Imports the game using the script-compatible importer or simulates in dry-run mode.
   * Handles "already exists" as a skip (not an error).
   *
   * Requirements: 3.1-3.8, 4.1, 6.2
   *
   * @param game The IGDB game to process
   * @param dryRun If true, simulate without writing to database
   */
  async processGame(game: IGDBGame, dryRun: boolean): Promise<void> {
    try {
      if (dryRun) {
        // In dry-run mode, simulate the import
        const releaseDate = game.first_release_date
          ? new Date(game.first_release_date * 1000).toISOString().split("T")[0]
          : "unknown";
        const genres = game.genres?.map((g) => g.name).join(", ") || "none";

        const videoCount = game.videos?.length ?? 0;

        console.log(
          `[Dry-run] Would import: "${game.name}" (IGDB ID: ${game.id}, Release: ${releaseDate}, Genres: ${genres}, Videos: ${videoCount})`
        );

        // In dry-run mode, we count as skipped to keep imported at 0
        this.stats.skipped++;
        return;
      }

      // Attempt to import the game using the script-compatible importer
      const result = await importGameFromIGDB(game.id, this.options.verbose, this.options.dryRun);

      if (result.success) {
        this.stats.imported++;
        if (this.options.verbose) {
          const action = result.synced ? "synced" : "imported";
          console.log(`[Import] Successfully ${action}: ${game.name} (IGDB ID: ${game.id})`);
        }
      } else {
        // Actual error - log and increment error counter
        this.stats.errors++;
        console.error(
          `[Error] Failed to import ${game.name} (IGDB ID: ${game.id}): ${result.error}`
        );
      }
    } catch (error) {
      // Unexpected error - log with context and continue
      this.stats.errors++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        `[Error] Unexpected error importing ${game.name} (IGDB ID: ${game.id}): ${errorMessage}`
      );
    }
  }

  /**
   * Run the bulk import process.
   * Fetches games in batches, processes each game, and tracks progress.
   * Respects limit and offset options for controlled imports.
   * Shows a progress bar with ETA when not in verbose mode.
   *
   * Requirements: 2.3, 5.1, 5.2, 5.3, 5.4
   *
   * @returns Final import statistics
   */
  async run(): Promise<ImportStats> {
    this.stats.startTime = new Date();

    const startOffset = this.options.offset ?? 0;
    this.currentOffset = startOffset;
    const maxGames = this.options.limit;
    let totalProcessed = 0;

    console.log(`[Import] Starting bulk import from IGDB...`);
    console.log(`[Import] Mode: ${this.options.dryRun ? "DRY-RUN (no database writes)" : "LIVE"}`);
    console.log(
      `[Import] Date range: ${this.options.fromDate.toISOString().split("T")[0]} to ${this.options.toDate.toISOString().split("T")[0]}`
    );
    if (maxGames) {
      console.log(`[Import] Limit: ${maxGames} games`);
    }
    if (startOffset > 0) {
      console.log(`[Import] Starting from offset: ${startOffset}`);
    }

    // Initialize progress tracker for non-verbose mode
    if (!this.options.verbose) {
      // Fetch total count for accurate progress estimation
      console.log(`[Import] Fetching total game count...`);
      this.estimatedTotal = await this.fetchTotalCount();

      // Apply limit if specified
      const effectiveTotal = maxGames
        ? Math.min(this.estimatedTotal - startOffset, maxGames)
        : this.estimatedTotal - startOffset;

      if (this.estimatedTotal > 0) {
        console.log(`[Import] Found ${this.estimatedTotal} games in date range`);
        if (startOffset > 0) {
          console.log(`[Import] Will process ~${effectiveTotal} games (after offset)`);
        }
      }

      this.progressTracker = new ProgressTracker(Math.max(effectiveTotal, 1), 500);
      console.log(`\n`); // Add spacing before progress bar
    }

    try {
      // Main pagination loop
      while (!this.isInterrupted) {
        // Calculate how many games to fetch in this batch
        const remainingGames = maxGames ? maxGames - totalProcessed : ImportOrchestrator.BATCH_SIZE;
        const batchSize = Math.min(remainingGames, ImportOrchestrator.BATCH_SIZE);

        if (batchSize <= 0) {
          break;
        }

        // Fetch the next batch of games
        const games = await this.fetchGamesBatch(this.currentOffset, batchSize);

        if (games.length === 0) {
          if (this.options.verbose) {
            console.log(`[Import] No more games found at offset ${this.currentOffset}`);
          }
          break;
        }

        // Process each game in the batch
        for (const game of games) {
          if (this.isInterrupted) {
            break;
          }

          if (maxGames && totalProcessed >= maxGames) {
            break;
          }

          await this.processGame(game, this.options.dryRun);
          totalProcessed++;
          this.stats.total = totalProcessed;

          // Update progress display
          if (this.progressTracker && !this.options.verbose) {
            this.progressTracker.update(totalProcessed, {
              imported: this.stats.imported,
              skipped: this.stats.skipped,
              errors: this.stats.errors,
            });
          } else if (this.options.verbose && totalProcessed % 10 === 0) {
            // Log progress periodically in verbose mode (every 10 games)
            console.log(
              `[Progress] Processed ${totalProcessed} games - ` +
                `Imported: ${this.stats.imported}, Skipped: ${this.stats.skipped}, Errors: ${this.stats.errors}`
            );
          }
        }

        if (this.isInterrupted || (maxGames && totalProcessed >= maxGames)) {
          break;
        }

        // Move to the next batch
        this.currentOffset += games.length;

        // If we got fewer games than requested, we've reached the end
        if (games.length < batchSize) {
          break;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Import] Fatal error during import: ${errorMessage}`);
    }

    // Finalize statistics
    this.stats.endTime = new Date();
    this.stats.total = totalProcessed;

    // Display final summary
    if (this.progressTracker && !this.options.verbose) {
      this.progressTracker.finish(this.stats);
    } else {
      // Print final summary for verbose mode
      const duration = this.stats.endTime.getTime() - this.stats.startTime.getTime();
      const durationSeconds = Math.round(duration / 1000);
      const durationMinutes = Math.floor(durationSeconds / 60);
      const remainingSeconds = durationSeconds % 60;

      console.log(`\n[Import] ========== IMPORT COMPLETE ==========`);
      console.log(`[Import] Total games processed: ${this.stats.total}`);
      console.log(`[Import] Successfully imported: ${this.stats.imported}`);
      console.log(`[Import] Skipped (existing): ${this.stats.skipped}`);
      console.log(`[Import] Errors: ${this.stats.errors}`);
      console.log(`[Import] Duration: ${durationMinutes}m ${remainingSeconds}s`);
      console.log(`[Import] ==========================================\n`);
    }

    return this.stats;
  }
}

// Re-export for convenience
export { IGDBService };
export type { IGDBGame };
