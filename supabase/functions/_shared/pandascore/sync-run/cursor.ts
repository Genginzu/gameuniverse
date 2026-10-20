export type SyncEntity =
  | "teams"
  | "tournaments_upcoming"
  | "tournaments_running"
  | "players"
  | "matches_past"
  | "matches_running";

export const SYNC_ENTITIES: readonly SyncEntity[] = [
  "teams",
  "tournaments_upcoming",
  "tournaments_running",
  "players",
  "matches_past",
  "matches_running",
];

export type SyncJobEntity = "teams" | "tournaments" | "players" | "matches";

export const ENTITY_CURSOR_KEYS: Record<SyncJobEntity, readonly SyncEntity[]> = {
  teams: ["teams"],
  tournaments: ["tournaments_upcoming", "tournaments_running"],
  players: ["players"],
  matches: ["matches_past", "matches_running"],
};

export interface EntityCursor {
  page: number;
  done: boolean;
}

export type Cursor = Record<SyncEntity, EntityCursor>;

export interface CursorScopeSource {
  kind: "full" | "entity";
  entity: string | null;
}

function isSyncJobEntity(value: string | null): value is SyncJobEntity {
  return value !== null && Object.prototype.hasOwnProperty.call(ENTITY_CURSOR_KEYS, value);
}

export function cursorKeysForJob(job: CursorScopeSource): readonly SyncEntity[] {
  if (job.kind === "entity" && isSyncJobEntity(job.entity)) {
    return ENTITY_CURSOR_KEYS[job.entity];
  }
  return SYNC_ENTITIES;
}

function isEntityCursor(value: unknown): value is EntityCursor {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as EntityCursor).page === "number" &&
    typeof (value as EntityCursor).done === "boolean"
  );
}

function migrateLegacyCursor(partial: Record<string, unknown>): Partial<Cursor> {
  const migrated: Partial<Cursor> = {};
  for (const key of SYNC_ENTITIES) {
    const value = partial[key];
    if (isEntityCursor(value)) migrated[key] = value;
  }
  if (!migrated.tournaments_upcoming && isEntityCursor(partial.tournaments)) {
    migrated.tournaments_upcoming = partial.tournaments;
  }
  if (!migrated.matches_past && isEntityCursor(partial.matches)) {
    migrated.matches_past = partial.matches;
  }
  return migrated;
}

export function ensureCursor(partial: unknown): Cursor {
  const source = typeof partial === "object" && partial !== null ? partial : {};
  const migrated = migrateLegacyCursor(source as Record<string, unknown>);
  const cursor = {} as Cursor;
  for (const key of SYNC_ENTITIES) {
    cursor[key] = migrated[key] ?? { page: 1, done: false };
  }
  return cursor;
}

export function pickNextEntity(
  cursor: Cursor,
  keys: readonly SyncEntity[] = SYNC_ENTITIES,
): SyncEntity | null {
  return keys.find((key) => !cursor[key].done) ?? null;
}

export function isCursorComplete(
  cursor: Cursor,
  keys: readonly SyncEntity[] = SYNC_ENTITIES,
): boolean {
  return keys.every((key) => cursor[key].done);
}
