import { describe, it, expect } from "vitest";
import {
  mergeSyncHistory,
  toSyncHistoryEntry,
  type SyncJobRow,
  type SyncLogRow,
} from "@/lib/pandascore/sync-history";

function logRow(overrides: Partial<SyncLogRow> = {}): SyncLogRow {
  return {
    id: "l1",
    trigger: "cron",
    status: "completed",
    teams_synced: 1,
    teams_errors: 0,
    players_synced: 2,
    players_errors: 1,
    tournaments_synced: 3,
    tournaments_errors: 0,
    matches_synced: 4,
    matches_errors: 2,
    error_message: null,
    error_details: [{ type: "player", id: 7, phase: "fetch", error: "boom" }],
    duration_ms: 1200,
    started_at: "2026-10-18T10:00:00.000Z",
    completed_at: "2026-10-18T10:00:01.200Z",
    ...overrides,
  };
}

function jobRow(overrides: Partial<SyncJobRow> = {}): SyncJobRow {
  return {
    id: "j1",
    kind: "entity",
    entity: "matches",
    status: "completed",
    total_synced: 500,
    total_errors: 3,
    error_message: null,
    error_details: null,
    started_at: "2026-10-18T09:00:00.000Z",
    completed_at: "2026-10-18T09:05:00.000Z",
    created_at: "2026-10-18T08:59:59.000Z",
    ...overrides,
  };
}

describe("toSyncHistoryEntry", () => {
  it("normalises an incremental log with per-entity counts", () => {
    expect(toSyncHistoryEntry({ source: "log", row: logRow() })).toEqual({
      id: "log_l1",
      kind: "incremental",
      trigger: "cron",
      status: "completed",
      total_synced: 10,
      total_errors: 3,
      duration_ms: 1200,
      started_at: "2026-10-18T10:00:00.000Z",
      completed_at: "2026-10-18T10:00:01.200Z",
      error_message: null,
      error_details: [{ type: "player", id: 7, phase: "fetch", error: "boom" }],
      per_entity: {
        teams_synced: 1,
        teams_errors: 0,
        players_synced: 2,
        players_errors: 1,
        tournaments_synced: 3,
        tournaments_errors: 0,
        matches_synced: 4,
        matches_errors: 2,
      },
      entity: null,
    });
  });

  it("normalises a full-sync job with a derived duration", () => {
    expect(toSyncHistoryEntry({ source: "job", row: jobRow() })).toMatchObject({
      id: "job_j1",
      kind: "full",
      trigger: "manual",
      total_synced: 500,
      total_errors: 3,
      duration_ms: 300_000,
      error_details: [],
      per_entity: null,
      entity: "matches",
    });
  });

  it("falls back to created_at for an unclaimed job", () => {
    const entry = toSyncHistoryEntry({ source: "job", row: jobRow({ started_at: null, completed_at: null }) });

    expect(entry.started_at).toBe("2026-10-18T08:59:59.000Z");
    expect(entry.duration_ms).toBeNull();
  });
});

describe("mergeSyncHistory", () => {
  it("sorts both run kinds by start date and paginates", () => {
    const records = [
      { source: "job" as const, row: jobRow() },
      { source: "log" as const, row: logRow() },
      { source: "log" as const, row: logRow({ id: "l2", started_at: "2026-10-18T11:00:00.000Z" }) },
    ];

    const firstPage = mergeSyncHistory(records, 1, 2);
    const secondPage = mergeSyncHistory(records, 2, 2);

    expect(firstPage.entries.map((entry) => entry.id)).toEqual(["log_l2", "log_l1"]);
    expect(secondPage.entries.map((entry) => entry.id)).toEqual(["job_j1"]);
    expect(firstPage).toMatchObject({ total: 3, page: 1, totalPages: 2 });
  });

  it("reports one page for an empty history", () => {
    expect(mergeSyncHistory([], 1, 20)).toEqual({ entries: [], total: 0, page: 1, totalPages: 1 });
  });
});
