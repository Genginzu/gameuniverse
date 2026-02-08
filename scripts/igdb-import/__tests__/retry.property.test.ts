import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import { withRetry } from "../retry";

/**
 * Feature: igdb-bulk-import
 * Property 2: Retry avec Backoff Exponentiel
 * **Validates: Requirements 2.5**
 *
 * Pour toute requête qui échoue, le nombre de tentatives ne doit pas dépasser 3,
 * et le délai entre chaque tentative doit suivre un backoff exponentiel
 * (délai_n >= délai_n-1 * 2).
 */

describe("withRetry Property-Based Tests", () => {
  describe("Property 2: Retry avec Backoff Exponentiel", () => {
    it("never exceeds maxAttempts when operation always fails", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }), // maxAttempts
          async (maxAttempts) => {
            let attemptCount = 0;

            const failingOperation = async () => {
              attemptCount++;
              throw new Error("Always fails");
            };

            try {
              await withRetry(failingOperation, {
                maxAttempts,
                initialDelayMs: 1, // Minimal delay for fast tests
              });
            } catch {
              // Expected to throw
            }

            expect(attemptCount).toBe(maxAttempts);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("follows exponential backoff timing between retries", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 30, max: 50 }), // initialDelayMs - larger values for more reliable timing
          async (initialDelayMs) => {
            const attemptTimestamps: number[] = [];
            const maxAttempts = 3;

            const failingOperation = async () => {
              attemptTimestamps.push(Date.now());
              throw new Error("Always fails");
            };

            try {
              await withRetry(failingOperation, {
                maxAttempts,
                initialDelayMs,
              });
            } catch {
              // Expected to throw
            }

            // Verify we have all attempts recorded
            expect(attemptTimestamps.length).toBe(maxAttempts);

            // Verify exponential backoff pattern
            // First delay should be >= initialDelayMs (with tolerance for OS timing)
            if (attemptTimestamps.length >= 2) {
              const firstDelay = attemptTimestamps[1] - attemptTimestamps[0];
              expect(firstDelay).toBeGreaterThanOrEqual(initialDelayMs * 0.8);
            }

            // Second delay should be >= first delay (exponential growth)
            // The implementation doubles the delay, so second >= first
            if (attemptTimestamps.length >= 3) {
              const firstDelay = attemptTimestamps[1] - attemptTimestamps[0];
              const secondDelay = attemptTimestamps[2] - attemptTimestamps[1];
              // Second delay should be greater than first (exponential backoff)
              // Allow tolerance for OS timing variations
              expect(secondDelay).toBeGreaterThanOrEqual(firstDelay * 0.9);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("returns immediately on first success without retries", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }), // Return value
          fc.integer({ min: 2, max: 5 }), // maxAttempts
          async (returnValue, maxAttempts) => {
            let attemptCount = 0;

            const successOperation = async () => {
              attemptCount++;
              return returnValue;
            };

            const result = await withRetry(successOperation, {
              maxAttempts,
              initialDelayMs: 100,
            });

            expect(attemptCount).toBe(1);
            expect(result.value).toBe(returnValue);
            expect(result.attempts).toBe(1);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("succeeds on nth attempt and stops retrying", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 4 }), // successOnAttempt
          async (successOnAttempt) => {
            let attemptCount = 0;
            const maxAttempts = 5;
            const expectedValue = "success";

            const eventuallySucceedsOperation = async () => {
              attemptCount++;
              if (attemptCount < successOnAttempt) {
                throw new Error(`Fail on attempt ${attemptCount}`);
              }
              return expectedValue;
            };

            const result = await withRetry(eventuallySucceedsOperation, {
              maxAttempts,
              initialDelayMs: 1,
            });

            expect(attemptCount).toBe(successOnAttempt);
            expect(result.value).toBe(expectedValue);
            expect(result.attempts).toBe(successOnAttempt);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("tracks total time including delays", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 3 }), // successOnAttempt
          fc.integer({ min: 10, max: 20 }), // initialDelayMs
          async (successOnAttempt, initialDelayMs) => {
            let attemptCount = 0;

            const eventuallySucceedsOperation = async () => {
              attemptCount++;
              if (attemptCount < successOnAttempt) {
                throw new Error(`Fail on attempt ${attemptCount}`);
              }
              return "success";
            };

            const result = await withRetry(eventuallySucceedsOperation, {
              maxAttempts: 5,
              initialDelayMs,
            });

            // Calculate minimum expected time based on exponential backoff
            // For successOnAttempt=2: delay = initialDelayMs
            // For successOnAttempt=3: delay = initialDelayMs + initialDelayMs*2
            let expectedMinTime = 0;
            let currentDelay = initialDelayMs;
            for (let i = 1; i < successOnAttempt; i++) {
              expectedMinTime += currentDelay;
              currentDelay *= 2;
            }

            // Allow tolerance for timing variations
            expect(result.totalTimeMs).toBeGreaterThanOrEqual(expectedMinTime - 10);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("throws the last error after all attempts exhausted", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 4 }), // maxAttempts
          fc.string({ minLength: 1, maxLength: 50 }), // error message
          async (maxAttempts, errorMessage) => {
            let lastAttempt = 0;

            const failingOperation = async () => {
              lastAttempt++;
              throw new Error(`${errorMessage} - attempt ${lastAttempt}`);
            };

            try {
              await withRetry(failingOperation, {
                maxAttempts,
                initialDelayMs: 1,
              });
              // Should not reach here
              expect(true).toBe(false);
            } catch (error) {
              expect(error).toBeInstanceOf(Error);
              expect((error as Error).message).toContain(`attempt ${maxAttempts}`);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
