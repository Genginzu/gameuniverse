#!/usr/bin/env bun
/**
 * IGDB Character Bulk Import Script
 *
 * Imports characters from IGDB API into Supabase database.
 * Completely separate from the game importer.
 *
 * Usage:
 *   bun run scripts/igdb-import/characters/index.ts [options]
 *
 * Options:
 *   --dry-run     Simulate import without writing to database
 *   --limit=N     Limit the number of characters to import
 *   --offset=N    Start import from a specific offset
 *   --verbose     Enable verbose logging
 *   --help        Show this help message
 *
 * Environment Variables:
 *   IGDB_CLIENT_ID      - Twitch/IGDB Client ID (required)
 *   IGDB_CLIENT_SECRET  - Twitch/IGDB Client Secret (required)
 */

import { validateCredentials } from "../shared/cli";
import { CharacterOrchestrator } from "./orchestrator";

const HELP_TEXT = `
IGDB Character Bulk Import Script

Imports characters from IGDB API into Supabase database.

Usage:
  bun run scripts/igdb-import/characters/index.ts [options]

Options:
  --dry-run     Simulate import without writing to database
  --limit=N     Limit the number of characters to import
  --offset=N    Start import from a specific offset
  --verbose     Enable verbose logging
  --help        Show this help message

Examples:
  bun run scripts/igdb-import/characters/index.ts --dry-run --limit=10
  bun run scripts/igdb-import/characters/index.ts --offset=500 --limit=100 --verbose
`;

export interface CharacterCLIOptions {
  dryRun: boolean;
  limit?: number;
  offset?: number;
  verbose: boolean;
}

function parseCharacterArgs(args: string[]): CharacterCLIOptions {
  const options: CharacterCLIOptions = {
    dryRun: false,
    verbose: false,
  };

  for (const arg of args) {
    if (arg === "--help" || arg === "-h") {
      console.log(HELP_TEXT);
      process.exit(0);
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const parsed = parseInt(arg.slice("--limit=".length), 10);
      if (isNaN(parsed) || parsed <= 0) {
        console.error(`Error: Invalid --limit value. Must be a positive integer.`);
        process.exit(1);
      }
      options.limit = parsed;
      continue;
    }

    if (arg.startsWith("--offset=")) {
      const parsed = parseInt(arg.slice("--offset=".length), 10);
      if (isNaN(parsed) || parsed < 0) {
        console.error(`Error: Invalid --offset value. Must be a non-negative integer.`);
        process.exit(1);
      }
      options.offset = parsed;
      continue;
    }

    if (arg.startsWith("--")) {
      console.error(`Error: Unknown option "${arg}". Use --help for usage information.`);
      process.exit(1);
    }
  }

  return options;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = parseCharacterArgs(args);

  if (!validateCredentials()) {
    process.exit(1);
  }

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║        IGDB Character Bulk Import Script                   ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  if (options.verbose) {
    console.log("[Config] Options:");
    console.log(`  - Dry-run: ${options.dryRun}`);
    console.log(`  - Limit: ${options.limit ?? "none"}`);
    console.log(`  - Offset: ${options.offset ?? 0}`);
    console.log(`  - Verbose: ${options.verbose}\n`);
  }

  const orchestrator = new CharacterOrchestrator(options);
  orchestrator.setupSignalHandlers();

  try {
    const stats = await orchestrator.run();

    if (stats.errors > 0) {
      console.log(`[Main] Completed with ${stats.errors} error(s)`);
      process.exit(2);
    }
    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Main] Fatal error: ${errorMessage}`);
    process.exit(1);
  }
}

const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("igdb-import/characters/index.ts") ||
  process.argv[1]?.endsWith("igdb-import\\characters\\index.ts");

if (isMainModule) {
  main();
}
