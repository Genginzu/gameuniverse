import type {
  SyncErrorDetail,
  SyncHistoryEntry,
  SyncHistoryPage,
  SyncPerEntityCounts,
} from "@/types/esport-sync";

export const SYNC_LOG_HISTORY_COLUMNS =
  "id, trigger, status, teams_synced, teams_errors, players_synced, players_errors, tournaments_synced, tournaments_errors, matches_synced, matches_errors, error_message, error_details, duration_ms, started_at, completed_at";

export const SYNC_JOB_HISTORY_COLUMNS =
  "id, kind, entity, status, total_synced, total_errors, error_message, error_details, started_at, completed_at, created_at";

export interface SyncLogRow extends SyncPerEntityCounts {
  id: string;
  trigger: string;
  status: string;
  error_message: string | null;
  error_details: unknown;
  duration_ms: number | null;
  started_at: string;
  completed_at: string | null;
}

export interface SyncJobRow {
  id: string;
  kind: string;
  entity: string | null;
  status: string;
  total_synced: number;
  total_errors: number;
  error_message: string | null;
  error_details: unknown;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export type SyncRunRecord =
  | { source: "log"; row: SyncLogRow }
  | { source: "job"; row: SyncJobRow };

const PER_ENTITY_KEYS = ["teams", "players", "tournaments", "matches"] as const;

function perEntityCounts(row: SyncLogRow): SyncPerEntityCounts {
  const counts = {} as SyncPerEntityCounts;
  for (const entity of PER_ENTITY_KEYS) {
    counts[`${entity}_synced`] = row[`${entity}_synced`] ?? 0;
    counts[`${entity}_errors`] = row[`${entity}_errors`] ?? 0;
  }
  return counts;
}

function sumCounts(counts: SyncPerEntityCounts, suffix: "synced" | "errors"): number {
  return PER_ENTITY_KEYS.reduce((total, entity) => total + counts[`${entity}_${suffix}`], 0);
}

function elapsedMs(startedAt: string | null, completedAt: string | null): number | null {
  if (!startedAt || !completedAt) return null;
  return new Date(completedAt).getTime() - new Date(startedAt).getTime();
}

function errorLedger(stored: unknown): SyncErrorDetail[] {
  return Array.isArray(stored) ? (stored as SyncErrorDetail[]) : [];
}

type SourceFacts = Pick<
  SyncHistoryEntry,
  "kind" | "trigger" | "total_synced" | "total_errors" | "duration_ms" | "started_at" | "per_entity" | "entity"
>;

function sourceFacts(record: SyncRunRecord): SourceFacts {
  if (record.source === "log") {
    const counts = perEntityCounts(record.row);
    return {
      kind: "incremental",
      trigger: record.row.trigger,
      total_synced: sumCounts(counts, "synced"),
      total_errors: sumCounts(counts, "errors"),
      duration_ms: record.row.duration_ms,
      started_at: record.row.started_at,
      per_entity: counts,
      entity: null,
    };
  }
  return {
    kind: "full",
    trigger: "manual",
    total_synced: record.row.total_synced,
    total_errors: record.row.total_errors,
    duration_ms: elapsedMs(record.row.started_at, record.row.completed_at),
    started_at: record.row.started_at ?? record.row.created_at,
    per_entity: null,
    entity: record.row.entity,
  };
}

export function toSyncHistoryEntry(record: SyncRunRecord): SyncHistoryEntry {
  const { row } = record;
  return {
    id: `${record.source}_${row.id}`,
    status: row.status,
    completed_at: row.completed_at,
    error_message: row.error_message,
    error_details: errorLedger(row.error_details),
    ...sourceFacts(record),
  };
}

export function mergeSyncHistory(
  records: SyncRunRecord[],
  page: number,
  limit: number,
): SyncHistoryPage {
  const merged = records
    .map(toSyncHistoryEntry)
    .sort((a, b) => (a.started_at < b.started_at ? 1 : a.started_at > b.started_at ? -1 : 0));
  return {
    entries: merged.slice((page - 1) * limit, page * limit),
    total: merged.length,
    page,
    totalPages: Math.max(1, Math.ceil(merged.length / limit)),
  };
}
