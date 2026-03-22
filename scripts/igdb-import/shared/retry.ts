/**
 * Retry logic with exponential backoff
 * Requirements: 2.5
 */

import type { RetryOptions, RetryResult } from "./types";

/**
 * Sleep for the specified duration
 * @param ms Duration in milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute an async operation with exponential backoff retry logic.
 *
 * The delay between retries follows exponential backoff:
 * - Attempt 1: immediate
 * - Attempt 2: initialDelayMs (default 1000ms)
 * - Attempt 3: initialDelayMs * 2 (default 2000ms)
 *
 * Requirements: 2.5
 *
 * @param operation The async operation to execute
 * @param options Retry configuration options
 * @returns The result of the operation with retry metadata
 * @throws The last error if all retry attempts fail
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    verbose = false,
    operationName = "operation",
  } = options;

  const startTime = Date.now();
  let lastError: Error | undefined;
  let currentDelay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (verbose && attempt > 1) {
        console.log(`[Retry] Attempt ${attempt}/${maxAttempts} for ${operationName}...`);
      }

      const value = await operation();

      return {
        value,
        attempts: attempt,
        totalTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (verbose) {
        console.log(
          `[Retry] ${operationName} failed on attempt ${attempt}/${maxAttempts}: ${lastError.message}`
        );
      }

      // If this was the last attempt, don't wait - just throw
      if (attempt === maxAttempts) {
        break;
      }

      // Wait with exponential backoff before next attempt
      if (verbose) {
        console.log(`[Retry] Waiting ${currentDelay}ms before next attempt...`);
      }

      await sleep(currentDelay);

      // Double the delay for next iteration (exponential backoff)
      currentDelay *= 2;
    }
  }

  // All attempts failed - throw the last error
  throw lastError;
}
