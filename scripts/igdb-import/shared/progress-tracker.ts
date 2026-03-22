/**
 * Progress Tracker for displaying import progress
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import type { ImportStats } from "./types";

/**
 * Tracks and displays import progress in real-time.
 * Shows percentage completion, counters, and estimated time remaining.
 * Uses carriage return to update the same line in the terminal.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export class ProgressTracker {
  private current: number = 0;
  private total: number;
  private startTime: Date;
  private lastUpdateTime: number = 0;
  private readonly updateIntervalMs: number;
  private lastLineLength: number = 0;

  /**
   * Create a new ProgressTracker
   * @param total Estimated total number of items to process
   * @param updateIntervalMs Minimum interval between progress updates in ms (default: 1000)
   */
  constructor(total: number, updateIntervalMs: number = 1000) {
    this.total = total;
    this.startTime = new Date();
    this.updateIntervalMs = updateIntervalMs;
  }

  /**
   * Update the progress display with current stats.
   * Throttles updates to avoid console spam.
   * Uses carriage return to overwrite the same line.
   *
   * Requirements: 5.1, 5.2
   *
   * @param current Current number of items processed
   * @param stats Object containing imported, skipped, and errors counts
   */
  update(current: number, stats: { imported: number; skipped: number; errors: number }): void {
    this.current = current;

    // Throttle updates to avoid console spam
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateIntervalMs) {
      return;
    }
    this.lastUpdateTime = now;

    const percentage = this.calculatePercentage();
    const eta = this.calculateETA();
    const elapsed = this.formatDuration(now - this.startTime.getTime());

    // Build progress bar
    const progressBar = this.buildProgressBar(percentage);

    // Format the progress line
    const progressLine =
      `${progressBar} ${percentage.toFixed(1).padStart(5)}% | ` +
      `${String(current).padStart(String(this.total).length)}/${this.total} | ` +
      `✓ ${stats.imported} | ⊘ ${stats.skipped} | ✗ ${stats.errors} | ` +
      `${elapsed} | ETA: ${eta}`;

    // Clear the previous line and write the new one
    const padding = Math.max(0, this.lastLineLength - progressLine.length);
    process.stdout.write(`\r${progressLine}${" ".repeat(padding)}`);
    this.lastLineLength = progressLine.length;
  }

  /**
   * Update the estimated total count.
   * Useful when the actual total becomes known during processing.
   *
   * @param newTotal The new estimated total
   */
  setTotal(newTotal: number): void {
    this.total = newTotal;
  }

  /**
   * Get the current total estimate
   */
  getTotal(): number {
    return this.total;
  }

  /**
   * Calculate the completion percentage
   */
  private calculatePercentage(): number {
    if (this.total === 0) return 0;
    return Math.min((this.current / this.total) * 100, 100);
  }

  /**
   * Calculate the estimated time remaining.
   * Uses the average processing rate to estimate remaining time.
   *
   * Requirements: 5.1
   *
   * @returns Formatted ETA string (e.g., "5m 30s" or "calculating...")
   */
  private calculateETA(): string {
    if (this.current === 0) {
      return "calculating...";
    }

    const elapsedMs = Date.now() - this.startTime.getTime();
    const msPerItem = elapsedMs / this.current;
    const remainingItems = this.total - this.current;

    if (remainingItems <= 0) {
      return "done";
    }

    const remainingMs = msPerItem * remainingItems;
    return this.formatDuration(remainingMs);
  }

  /**
   * Format a duration in milliseconds to a human-readable string.
   *
   * @param ms Duration in milliseconds
   * @returns Formatted string (e.g., "1h 23m 45s" or "45s")
   */
  private formatDuration(ms: number): string {
    const totalSeconds = Math.round(ms / 1000);

    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }

    return `${minutes}m ${seconds}s`;
  }

  /**
   * Build a visual progress bar string.
   *
   * @param percentage Completion percentage (0-100)
   * @returns Progress bar string (e.g., "[████████░░░░░░░░░░░░]")
   */
  private buildProgressBar(percentage: number): string {
    const width = 20;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;

    const filledBar = "█".repeat(filled);
    const emptyBar = "░".repeat(empty);

    return `[${filledBar}${emptyBar}]`;
  }

  /**
   * Display the final summary when import is complete.
   * Shows total time, final counts, and processing rate.
   * Moves to a new line before printing the summary.
   *
   * Requirements: 5.3, 5.4
   *
   * @param stats Final import statistics
   */
  finish(stats: ImportStats): void {
    // Move to a new line after the progress bar
    process.stdout.write("\n");

    const endTime = stats.endTime ?? new Date();
    const totalMs = endTime.getTime() - this.startTime.getTime();
    const totalDuration = this.formatDuration(totalMs);

    // Calculate processing rate
    const totalSeconds = totalMs / 1000;
    const rate = totalSeconds > 0 ? (stats.total / totalSeconds).toFixed(2) : "N/A";

    console.log(`\n${"═".repeat(60)}`);
    console.log(`  IMPORT COMPLETE`);
    console.log(`${"═".repeat(60)}`);
    console.log(`  Total games processed:  ${stats.total}`);
    console.log(`  Successfully imported:  ${stats.imported}`);
    console.log(`  Skipped (existing):     ${stats.skipped}`);
    console.log(`  Errors:                 ${stats.errors}`);
    console.log(`${"─".repeat(60)}`);
    console.log(`  Total time:             ${totalDuration}`);
    console.log(`  Processing rate:        ${rate} games/sec`);
    console.log(`${"═".repeat(60)}\n`);
  }
}
