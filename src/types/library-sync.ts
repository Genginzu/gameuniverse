import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { ExternalGameCategory } from "@/lib/services/igdb-external-games";

// Shared types for background library-sync jobs.

/** Platforms that support automated library synchronization. */
export const SYNCABLE_PLATFORMS = ["steam", "xbox", "playstation"] as const;
export type SyncablePlatform = (typeof SYNCABLE_PLATFORMS)[number];

export function isSyncablePlatform(value: string): value is SyncablePlatform {
  return (SYNCABLE_PLATFORMS as readonly string[]).includes(value);
}

export type LibrarySyncStatus = "pending" | "running" | "succeeded" | "failed";

export type LibrarySyncPhase =
  "starting" | "fetching" | "resolving" | "importing" | "saving" | "done" | "failed";

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

export interface PlatformLibraryItem {
  sourceId: string;
  name: string;
  uids: string[];
  playtimeMinutes?: number;
}

export interface PlatformLibraryFetch {
  items: PlatformLibraryItem[];
  privateProfile?: boolean;
}

export interface LibrarySyncAdapter {
  platform: SyncablePlatform;
  externalCategory: ExternalGameCategory;
  fetchLibrary(supabase: SupabaseClient<Database>, userId: string): Promise<PlatformLibraryFetch>;
  findKnownGames?(
    supabase: SupabaseClient<Database>,
    items: PlatformLibraryItem[]
  ): Promise<Map<string, string>>;
  pickDuplicate?(
    existing: PlatformLibraryItem,
    candidate: PlatformLibraryItem
  ): PlatformLibraryItem;
}

export interface LibrarySyncResult {
  total: number;
  matched: number;
  upserted: number;
  unmatched: number;
  imported: number;
  pending: number;
  done: boolean;
  privateProfile: boolean;
}

export interface LibrarySyncJobOutcome {
  status: "succeeded" | "continuing" | "failed";
  total: number;
  matched: number;
  error?: string;
}
