export type SyncCursorKey =
  | "teams"
  | "tournaments_upcoming"
  | "tournaments_running"
  | "players"
  | "matches_past"
  | "matches_running";

export type SyncJobEntity = "teams" | "tournaments" | "players" | "matches";

export type SyncRunStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface SyncCursorEntry {
  page: number;
  done: boolean;
}

export type SyncJobCursor = Partial<Record<SyncCursorKey, SyncCursorEntry>>;

export interface SyncJob {
  id: string;
  kind: "full" | "entity";
  entity: string | null;
  game: string | null;
  status: SyncRunStatus;
  cursor: SyncJobCursor;
  total_synced: number;
  total_errors: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  last_chunk_at: string | null;
  created_at: string;
}

export interface SyncErrorDetail {
  type: string;
  id: number | null;
  phase: string;
  error: string;
  dropped?: number;
}

export interface SyncPerEntityCounts {
  teams_synced: number;
  teams_errors: number;
  players_synced: number;
  players_errors: number;
  tournaments_synced: number;
  tournaments_errors: number;
  matches_synced: number;
  matches_errors: number;
}

export interface SyncHistoryEntry {
  id: string;
  kind: "incremental" | "full";
  trigger: string;
  status: string;
  total_synced: number;
  total_errors: number;
  duration_ms: number | null;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  error_details: SyncErrorDetail[];
  per_entity: SyncPerEntityCounts | null;
  entity: string | null;
}

export interface SyncHistoryPage {
  entries: SyncHistoryEntry[];
  total: number;
  page: number;
  totalPages: number;
}
