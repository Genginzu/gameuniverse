import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import { RateLimiter } from "../../../scripts/igdb-import/rate-limiter";

/**
 * Feature: igdb-bulk-import
 * Property 1: Rate Limiting Respecté
 * **Validates: Requirements 2.4**
 *
 * Pour toute séquence de N requêtes effectuées par le RateLimiter,
 * le temps écoulé entre la première et la dernière requête doit être
 * au moins (N-1) / maxRequests windows.
 */

describe("RateLimiter Property-Based Tests", () => {
  describe("Property 1: Rate Limiting Respecté", () => {
    it("ensures elapsed time respects rate limiting for sequences of requests", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 5, max: 8 }), // Number of requests
          async (numRequests) => {
            const maxRequests = 4;
            const windowMs = 50; // Small window for fast tests
            const rateLimiter = new RateLimiter(maxRequests, windowMs);

            const startTime = Date.now();

            for (let i = 0; i < numRequests; i++) {
              await rateLimiter.throttle();
            }

            const elapsedMs = Date.now() - startTime;
            const windowsNeeded = Math.floor((numRequests - 1) / maxRequests);
            const minExpectedMs = windowsNeeded * windowMs;

            expect(elapsedMs).toBeGreaterThanOrEqual(minExpectedMs - 20);
          }
        ),
        { numRuns: 20 }
      );
    });

    it("allows up to maxRequests within a single window without delay", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 6 }), // Max requests per window
          async (maxRequests) => {
            const windowMs = 500;
            const rateLimiter = new RateLimiter(maxRequests, windowMs);

            const startTime = Date.now();

            // Execute exactly maxRequests (should be nearly instant)
            for (let i = 0; i < maxRequests; i++) {
              await rateLimiter.throttle();
            }

            const elapsedMs = Date.now() - startTime;

            // First maxRequests should complete quickly
            expect(elapsedMs).toBeLessThan(100);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("enforces waiting when exceeding maxRequests in a window", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 4 }), // Max requests per window
          async (maxRequests) => {
            const windowMs = 50; // Small window for fast tests
            const rateLimiter = new RateLimiter(maxRequests, windowMs);

            const startTime = Date.now();

            // Execute maxRequests + 1 (should trigger one wait)
            for (let i = 0; i < maxRequests + 1; i++) {
              await rateLimiter.throttle();
            }

            const elapsedMs = Date.now() - startTime;

            // Should have waited at least close to windowMs for the extra request
            expect(elapsedMs).toBeGreaterThanOrEqual(windowMs - 20);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("maintains request count within bounds after throttling", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 6 }), // Number of requests
          fc.integer({ min: 2, max: 4 }), // Max requests per window
          async (numRequests, maxRequests) => {
            const windowMs = 100;
            const rateLimiter = new RateLimiter(maxRequests, windowMs);

            for (let i = 0; i < numRequests; i++) {
              await rateLimiter.throttle();
            }

            // Request count should never exceed maxRequests within the window
            const count = rateLimiter.getRequestCount();
            expect(count).toBeLessThanOrEqual(maxRequests);
            expect(count).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("resets properly and allows new requests immediately", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 4 }), // Max requests per window
          async (maxRequests) => {
            const windowMs = 200;
            const rateLimiter = new RateLimiter(maxRequests, windowMs);

            // Fill up the rate limiter
            for (let i = 0; i < maxRequests; i++) {
              await rateLimiter.throttle();
            }

            // Reset
            rateLimiter.reset();

            // Should be able to make requests immediately again
            const startTime = Date.now();
            for (let i = 0; i < maxRequests; i++) {
              await rateLimiter.throttle();
            }
            const elapsedMs = Date.now() - startTime;

            // Should complete quickly after reset
            expect(elapsedMs).toBeLessThan(100);
            expect(rateLimiter.getRequestCount()).toBe(maxRequests);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
