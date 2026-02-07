/**
 * Checkpoint management for resuming interrupted imports
 * Requirements: 4.3
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { CheckpointData } from "./types";

/**
 * Default checkpoint file path in the system temp directory
 */
const DEFAULT_CHECKPOINT_PATH = path.join(os.tmpdir(), "igdb-import-checkpoint.json");

/**
 * Save checkpoint data to a JSON file.
 * Allows resuming interrupted imports from the last saved position.
 *
 * Requirements: 4.3
 *
 * @param checkpoint The checkpoint data to save
 * @param filePath Optional custom file path (defaults to temp directory)
 */
export function saveCheckpoint(
  checkpoint: CheckpointData,
  filePath: string = DEFAULT_CHECKPOINT_PATH
): void {
  try {
    const data = JSON.stringify(checkpoint, null, 2);
    fs.writeFileSync(filePath, data, "utf-8");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Checkpoint] Failed to save checkpoint: ${errorMessage}`);
  }
}

/**
 * Load checkpoint data from a JSON file if it exists.
 * Returns null if no checkpoint file exists or if it's invalid.
 *
 * Requirements: 4.3
 *
 * @param filePath Optional custom file path (defaults to temp directory)
 * @returns The loaded checkpoint data, or null if not found/invalid
 */
export function loadCheckpoint(filePath: string = DEFAULT_CHECKPOINT_PATH): CheckpointData | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const data = fs.readFileSync(filePath, "utf-8");
    const checkpoint = JSON.parse(data) as CheckpointData;

    // Validate the checkpoint structure
    if (
      typeof checkpoint.lastOffset !== "number" ||
      typeof checkpoint.lastIgdbId !== "number" ||
      !checkpoint.stats ||
      !checkpoint.timestamp
    ) {
      console.warn("[Checkpoint] Invalid checkpoint file structure, ignoring");
      return null;
    }

    // Convert timestamp string back to Date
    checkpoint.timestamp = new Date(checkpoint.timestamp);
    checkpoint.stats.startTime = new Date(checkpoint.stats.startTime);
    if (checkpoint.stats.endTime) {
      checkpoint.stats.endTime = new Date(checkpoint.stats.endTime);
    }

    return checkpoint;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[Checkpoint] Failed to load checkpoint: ${errorMessage}`);
    return null;
  }
}

/**
 * Delete the checkpoint file after a successful import.
 *
 * Requirements: 4.3
 *
 * @param filePath Optional custom file path (defaults to temp directory)
 */
export function deleteCheckpoint(filePath: string = DEFAULT_CHECKPOINT_PATH): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[Checkpoint] Failed to delete checkpoint: ${errorMessage}`);
  }
}

/**
 * Get the default checkpoint file path
 */
export function getCheckpointFilePath(): string {
  return DEFAULT_CHECKPOINT_PATH;
}
