/**
 * Rate Limiter for IGDB API requests
 * Requirements: 2.4
 */

/**
 * Rate limiter using a sliding window algorithm.
 * Ensures no more than maxRequests are made within windowMs milliseconds.
 * Requirements: 2.4
 */
export class RateLimiter {
  private requestTimes: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  /**
   * Create a new RateLimiter
   * @param maxRequests Maximum number of requests allowed in the window (default: 4)
   * @param windowMs Window size in milliseconds (default: 1000ms = 1 second)
   */
  constructor(maxRequests: number = 4, windowMs: number = 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Throttle requests to respect rate limits.
   * If the rate limit would be exceeded, waits until a slot is available.
   * Uses a sliding window algorithm to track requests.
   */
  async throttle(): Promise<void> {
    const now = Date.now();

    // Remove timestamps outside the current window
    this.requestTimes = this.requestTimes.filter((time) => now - time < this.windowMs);

    // If we've hit the limit, wait until the oldest request exits the window
    if (this.requestTimes.length >= this.maxRequests) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = this.windowMs - (now - oldestRequest);

      if (waitTime > 0) {
        await this.sleep(waitTime);
        // After waiting, clean up again
        const newNow = Date.now();
        this.requestTimes = this.requestTimes.filter((time) => newNow - time < this.windowMs);
      }
    }

    // Record this request
    this.requestTimes.push(Date.now());
  }

  /**
   * Sleep for the specified duration
   * @param ms Duration in milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get the current number of requests in the window (for testing/debugging)
   */
  getRequestCount(): number {
    const now = Date.now();
    this.requestTimes = this.requestTimes.filter((time) => now - time < this.windowMs);
    return this.requestTimes.length;
  }

  /**
   * Reset the rate limiter (for testing)
   */
  reset(): void {
    this.requestTimes = [];
  }
}
