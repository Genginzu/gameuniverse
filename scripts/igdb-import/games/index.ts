#!/usr/bin/env bun
/**
 * IGDB Bulk Import Script
 *
 * Imports games from the last 10 years from IGDB API into Supabase database.
 *
 * Usage:
 *   bun run scripts/igdb-import/games/index.ts [options]
 *
 * Options:
 *   --dry-run     Simulate import without writing to database
 *   --limit=N     Limit the number of games to import
 *   --offset=N    Start import from a specific offset
 *   --verbose     Enable verbose logging
 *   --help        Show this help message
 *
 * Examples:
 *   bun run scripts/igdb-import/games/index.ts --dry-run --limit=10
 *   bun run scripts/igdb-import/games/index.ts --offset=500 --limit=100 --verbose
 *
 * Environment Variables:
 *   IGDB_CLIENT_ID      - Twitch/IGDB Client ID (required)
 *   IGDB_CLIENT_SECRET  - Twitch/IGDB Client Secret (required)
 *
 * Requirements: 6.1, 6.5
 */

import { parseArgs, validateCredentials } from "../shared/cli";
import { ImportOrchestrator } from "./orchestrator";

/**
 * Main entry point for the IGDB bulk import script.
 * Parses CLI arguments, validates credentials, initializes the orchestrator,
 * and runs the import process.
 *
 * Requirements: 6.1
 */
export async function main(): Promise<void> {
  // Parse command line arguments (skip first two: bun and script path)
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  // Validate credentials (needed even in dump mode for game versions, DLC, and playtime API calls)
  if (!validateCredentials()) {
    process.exit(1);
  }

  // Display startup banner
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║           IGDB Bulk Import Script                          ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  if (options.verbose) {
    console.log("[Config] Options:");
    console.log(`  - Source: ${options.source}`);
    if (options.source === "dump") {
      console.log(`  - Dumps directory: ${options.dumpFile}`);
    } else {
      console.log(`  - From date: ${options.fromDate.toISOString().split("T")[0]}`);
      console.log(`  - To date: ${options.toDate.toISOString().split("T")[0]}`);
    }
    console.log(`  - Dry-run: ${options.dryRun}`);
    console.log(`  - Limit: ${options.limit ?? "none"}`);
    console.log(`  - Offset: ${options.offset ?? 0}`);
    console.log(`  - Verbose: ${options.verbose}`);
    console.log(`  - Notable only: ${options.notableOnly}`);
    console.log("");
  }

  // Initialize the orchestrator
  const orchestrator = new ImportOrchestrator(options);

  // Set up signal handlers for graceful shutdown
  orchestrator.setupSignalHandlers();

  try {
    // Run the import process
    const stats = await orchestrator.run();

    // Exit with appropriate code based on results
    if (stats.errors > 0) {
      console.log(`[Main] Completed with ${stats.errors} error(s)`);
      process.exit(2); // Partial success
    }

    process.exit(0); // Full success
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Main] Fatal error: ${errorMessage}`);
    process.exit(1);
  }
}

// Run main if this is the entry point
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("igdb-import/games/index.ts") ||
  process.argv[1]?.endsWith("igdb-import\\games\\index.ts");

if (isMainModule) {
  main();
}

// Re-export all modules for external use
export * from "../shared/types";
export * from "../shared/cli";
export * from "../shared/rate-limiter";
export * from "../shared/retry";
export * from "../shared/progress-tracker";
export * from "./orchestrator";
