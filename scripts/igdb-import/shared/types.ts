/**
 * Type definitions for the IGDB Bulk Import Script
 */

/**
 * Data source for the import: API calls or local dump file
 */
export type ImportSource = "api" | "dump";

/**
 * CLI options parsed from command line arguments
 */
export interface CLIOptions {
  dryRun: boolean;
  limit?: number;
  offset?: number;
  verbose: boolean;
  /** Start date for filtering games by release date (YYYY-MM-DD) - required when source=api */
  fromDate: Date;
  /** End date for filtering games by release date (YYYY-MM-DD) - defaults to today */
  toDate: Date;
  /** Only import notable games (with ratings, reviews, hypes, or follows) */
  notableOnly: boolean;
  /** Only import non-notable games (inverse of notableOnly) */
  notNotable: boolean;
  /** Data source: 'api' (default) or 'dump' (local file) */
  source: ImportSource;
  /** Path to the dump file (required when source=dump) */
  dumpFile?: string;
}

/**
 * Statistics tracked during import process
 */
export interface ImportStats {
  total: number;
  imported: number;
  skipped: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
}

/**
 * Options for the withRetry function
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in milliseconds before first retry (default: 1000ms) */
  initialDelayMs?: number;
  /** Enable verbose logging of retry attempts */
  verbose?: boolean;
  /** Optional label for logging purposes */
  operationName?: string;
}

/**
 * Result of a retry operation, including metadata about attempts
 */
export interface RetryResult<T> {
  /** The successful result value */
  value: T;
  /** Number of attempts made (1 = succeeded on first try) */
  attempts: number;
  /** Total time spent including delays (in milliseconds) */
  totalTimeMs: number;
}
