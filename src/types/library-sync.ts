// Shared types for background library-sync jobs.

/** Platforms that support automated library synchronization. */
export const SYNCABLE_PLATFORMS = ["steam", "xbox"] as const;
export type SyncablePlatform = (typeof SYNCABLE_PLATFORMS)[number];

export function isSyncablePlatform(value: string): value is SyncablePlatform {
  return (SYNCABLE_PLATFORMS as readonly string[]).includes(value);
}

export type LibrarySyncStatus = "pending" | "running" | "succeeded" | "failed";

export type LibrarySyncPhase =
  | "starting"
  | "fetching"
  | "resolving"
  | "importing"
  | "saving"
  | "done"
  | "failed";

/** A background library-sync job as exposed to the client. */
export interface LibrarySyncJob {
  id: string;
  platform: string;
  status: LibrarySyncStatus;
  phase: LibrarySyncPhase;
  total: number;
  processed: number;
  matched: number;
  imported: number;
  unmatched: number;
  privateProfile: boolean;
  currentItem: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
  createdAt: string;
}

/**
 * Incremental progress reported by a sync service. All fields are optional so
 * a service can report only what changed at each step.
 */
export interface LibrarySyncProgress {
  phase?: LibrarySyncPhase;
  total?: number;
  processed?: number;
  matched?: number;
  imported?: number;
  unmatched?: number;
  privateProfile?: boolean;
  /** Label of the item currently being processed (e.g. game name on import). */
  currentItem?: string;
}

/** Callback used by sync services to stream progress to the job row. */
export type LibrarySyncProgressCallback = (progress: LibrarySyncProgress) => void;
