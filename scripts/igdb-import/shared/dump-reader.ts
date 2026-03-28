/**
 * Dump File Reader for IGDB bulk import.
 *
 * Reads pre-fetched IGDB data from local JSON files instead of calling the API.
 * Supports two formats:
 *   - JSON Array: a single file containing a JSON array of objects
 *   - NDJSON (Newline-Delimited JSON): one JSON object per line
 *
 * The reader loads the full file into memory, then serves batches on demand
 * via the same pagination interface as the API fetcher.
 */

import { existsSync } from "fs";
import { readFile } from "fs/promises";

/**
 * Generic dump reader that loads items from a JSON/NDJSON file
 * and serves them in batches, mimicking the API fetcher interface.
 */
export class DumpReader<T> {
  private items: T[] = [];
  private loaded = false;
  private filePath: string;
  private verbose: boolean;

  constructor(filePath: string, verbose: boolean = false) {
    this.filePath = filePath;
    this.verbose = verbose;
  }

  /**
   * Load and parse the dump file. Must be called before reading batches.
   * Detects format automatically (JSON array vs NDJSON).
   */
  async load(): Promise<void> {
    if (this.loaded) return;

    if (!existsSync(this.filePath)) {
      throw new Error(`Dump file not found: ${this.filePath}`);
    }

    const raw = await readFile(this.filePath, "utf-8");
    const trimmed = raw.trim();

    if (trimmed.startsWith("[")) {
      // JSON Array format
      this.items = JSON.parse(trimmed) as T[];
    } else {
      // NDJSON format: one JSON object per line
      this.items = trimmed
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .map((line, index) => {
          try {
            return JSON.parse(line) as T;
          } catch {
            throw new Error(`Invalid JSON at line ${index + 1} in ${this.filePath}`);
          }
        });
    }

    this.loaded = true;

    if (this.verbose) {
      console.log(`[DumpReader] Loaded ${this.items.length} items from ${this.filePath}`);
    }
  }

  /**
   * Load items directly from an in-memory array (used by dump assembler flow).
   * Skips file I/O entirely.
   */
  loadFromArray(items: T[]): void {
    this.items = items;
    this.loaded = true;

    if (this.verbose) {
      console.log(`[DumpReader] Loaded ${this.items.length} items from memory`);
    }
  }

  /** Total number of items in the dump */
  getTotalCount(): number {
    return this.items.length;
  }

  /**
   * Read a batch of items starting at the given offset.
   * Returns an empty array when there are no more items.
   */
  readBatch(offset: number, limit: number): T[] {
    if (!this.loaded) {
      throw new Error("DumpReader not loaded. Call load() first.");
    }
    return this.items.slice(offset, offset + limit);
  }
}
