/**
 * CLI Parser for the IGDB Bulk Import Script
 * Requirements: 6.2, 6.3, 6.4
 */

import type { CLIOptions } from "./types";

const HELP_TEXT = `
IGDB Bulk Import Script

Imports games from IGDB API or IGDB data dumps into Supabase database.

Usage:
  bun run scripts/igdb-import/games/index.ts --from=YYYY-MM-DD [options]
  bun run scripts/igdb-import/games/index.ts --source=dump [options]

Required (API mode):
  --from=DATE        Start date for game release (YYYY-MM-DD format)

Dump mode:
  --source=dump      Download CSV dumps from IGDB and import from them
  --dump-dir=PATH    Directory for CSV downloads (default: scripts/igdb-import/dumps)

Options:
  --to=DATE          End date for game release (YYYY-MM-DD format, defaults to today)
  --dry-run          Simulate import without writing to database
  --limit=N          Limit the number of games to import
  --offset=N         Start import from a specific offset
  --notable-only     Only import notable games (with player/press ratings, hypes, or follows)
  --not-notable      Only import non-notable games (no ratings, hypes, or follows)
  --verbose          Enable verbose logging
  --help             Show this help message

Examples:
  # API mode
  bun run scripts/igdb-import/games/index.ts --from=2024-01-01 --dry-run --limit=10
  bun run scripts/igdb-import/games/index.ts --from=2023-01-01 --to=2023-12-31 --verbose

  # Dump mode (downloads CSVs from IGDB, assembles and imports)
  bun run scripts/igdb-import/games/index.ts --source=dump --verbose
  bun run scripts/igdb-import/games/index.ts --source=dump --dump-dir=./my-dumps --limit=100
`;

/**
 * Parse a date string in YYYY-MM-DD format
 * @param dateStr The date string to parse
 * @returns The parsed Date object or null if invalid
 */
function parseDateArg(dateStr: string): Date | null {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return null;
  }

  // Parse as UTC to avoid timezone issues
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/**
 * Parse command line arguments into CLIOptions
 * Requirements: 6.2, 6.3, 6.4
 */
export function parseArgs(args: string[]): CLIOptions {
  // Default toDate to today at UTC midnight
  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

  const options: CLIOptions = {
    dryRun: false,
    verbose: false,
    notableOnly: false,
    notNotable: false,
    fromDate: todayUTC, // Will be set from --from argument
    toDate: todayUTC, // Defaults to today
    source: "api", // Default to API mode
  };

  let fromDateProvided = false;

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

    if (arg === "--notable-only") {
      options.notableOnly = true;
      continue;
    }

    if (arg === "--not-notable") {
      options.notNotable = true;
      continue;
    }

    if (arg.startsWith("--source=")) {
      const value = arg.slice("--source=".length);
      if (value !== "api" && value !== "dump") {
        console.error(`Error: Invalid value for --source: "${value}". Must be "api" or "dump".`);
        process.exit(1);
      }
      options.source = value;
      continue;
    }

    if (arg.startsWith("--dump-dir=")) {
      options.dumpFile = arg.slice("--dump-dir=".length);
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const value = arg.slice("--limit=".length);
      const parsed = parseInt(value, 10);
      if (isNaN(parsed) || parsed <= 0) {
        console.error(`Error: Invalid value for --limit: "${value}". Must be a positive integer.`);
        process.exit(1);
      }
      options.limit = parsed;
      continue;
    }

    if (arg.startsWith("--offset=")) {
      const value = arg.slice("--offset=".length);
      const parsed = parseInt(value, 10);
      if (isNaN(parsed) || parsed < 0) {
        console.error(
          `Error: Invalid value for --offset: "${value}". Must be a non-negative integer.`
        );
        process.exit(1);
      }
      options.offset = parsed;
      continue;
    }

    if (arg.startsWith("--from=")) {
      const value = arg.slice("--from=".length);
      const parsed = parseDateArg(value);
      if (!parsed) {
        console.error(`Error: Invalid value for --from: "${value}". Must be in YYYY-MM-DD format.`);
        process.exit(1);
      }
      options.fromDate = parsed;
      fromDateProvided = true;
      continue;
    }

    if (arg.startsWith("--to=")) {
      const value = arg.slice("--to=".length);
      const parsed = parseDateArg(value);
      if (!parsed) {
        console.error(`Error: Invalid value for --to: "${value}". Must be in YYYY-MM-DD format.`);
        process.exit(1);
      }
      options.toDate = parsed;
      continue;
    }

    // Unknown argument
    if (arg.startsWith("--")) {
      console.error(`Error: Unknown option "${arg}". Use --help for usage information.`);
      process.exit(1);
    }
  }

  // Dump mode: default dumps directory if not specified
  if (options.source === "dump") {
    if (!options.dumpFile) {
      options.dumpFile = "scripts/igdb-import/dumps";
    }
  }

  // --from is required in both modes
  if (!fromDateProvided) {
    console.error("Error: --from=YYYY-MM-DD is required.");
    console.error("Use --help for usage information.");
    process.exit(1);
  }

  // Validate date range
  if (options.fromDate > options.toDate) {
    console.error("Error: --from date must be before or equal to --to date.");
    process.exit(1);
  }

  return options;
}

/**
 * Validate that required IGDB credentials are present in environment variables.
 * Displays an explicit error message if credentials are missing.
 *
 * Requirements: 1.1, 1.2
 *
 * @returns True if credentials are valid, false otherwise
 */
export function validateCredentials(): boolean {
  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;

  const errors: string[] = [];

  if (!clientId || clientId.trim() === "") {
    errors.push("IGDB_CLIENT_ID is not set or is empty");
  }

  if (!clientSecret || clientSecret.trim() === "") {
    errors.push("IGDB_CLIENT_SECRET is not set or is empty");
  }

  if (errors.length > 0) {
    console.error("\n╔════════════════════════════════════════════════════════════╗");
    console.error("║  ERROR: Missing IGDB Credentials                           ║");
    console.error("╠════════════════════════════════════════════════════════════╣");
    for (const error of errors) {
      console.error(`║  • ${error.padEnd(55)}║`);
    }
    console.error("╠════════════════════════════════════════════════════════════╣");
    console.error("║  Please set the following environment variables:           ║");
    console.error("║    - IGDB_CLIENT_ID                                        ║");
    console.error("║    - IGDB_CLIENT_SECRET                                    ║");
    console.error("║                                                            ║");
    console.error("║  You can obtain these from: https://dev.twitch.tv/console  ║");
    console.error("╚════════════════════════════════════════════════════════════╝\n");
    return false;
  }

  return true;
}
