import type {
  SyncCursorKey,
  SyncJob,
  SyncJobEntity,
} from "@/types/esport-sync";

export const SYNC_CURSOR_KEYS: readonly SyncCursorKey[] = [
  "teams",
  "tournaments_upcoming",
  "tournaments_running",
  "players",
  "matches_past",
  "matches_running",
];

export const SYNC_JOB_ENTITIES: readonly SyncJobEntity[] = ["teams", "tournaments", "players", "matches"];

export const ENTITY_CURSOR_KEYS: Record<SyncJobEntity, readonly SyncCursorKey[]> = {
  teams: ["teams"],
  tournaments: ["tournaments_upcoming", "tournaments_running"],
  players: ["players"],
  matches: ["matches_past", "matches_running"],
};

export type SyncCursorVariant = "upcoming" | "running" | "past";

const CURSOR_VARIANTS: Partial<Record<SyncCursorKey, SyncCursorVariant>> = {
  tournaments_upcoming: "upcoming",
  tournaments_running: "running",
  matches_past: "past",
  matches_running: "running",
};

const PAGE_ESTIMATES: Record<SyncCursorKey, number> = {
  teams: 150,
  tournaments_upcoming: 10,
  tournaments_running: 5,
  players: 500,
  matches_past: 1100,
  matches_running: 5,
};

export interface SyncProgressBar {
  key: SyncCursorKey;
  variant: SyncCursorVariant | null;
  page: number;
  done: boolean;
  estimate: number;
  percent: number;
  isCurrent: boolean;
}

export interface SyncProgressEntity {
  key: SyncJobEntity;
  done: boolean;
  isCurrent: boolean;
  bars: SyncProgressBar[];
}

export interface SyncProgressView {
  currentKey: SyncCursorKey | null;
  entities: SyncProgressEntity[];
}

export function isSyncJobEntity(value: unknown): value is SyncJobEntity {
  return typeof value === "string" && (SYNC_JOB_ENTITIES as readonly string[]).includes(value);
}

export function cursorKeysForJob(job: Pick<SyncJob, "kind" | "entity">): readonly SyncCursorKey[] {
  if (job.kind === "entity" && isSyncJobEntity(job.entity)) {
    return ENTITY_CURSOR_KEYS[job.entity];
  }
  return SYNC_CURSOR_KEYS;
}

function progressPercent(page: number, done: boolean, estimate: number): number {
  if (done) return 100;
  return Math.min(99, Math.round((Math.max(0, page - 1) / estimate) * 100));
}

export function buildSyncProgressView(
  job: Pick<SyncJob, "kind" | "entity" | "status" | "cursor">,
): SyncProgressView {
  const scope = cursorKeysForJob(job);
  const isActive = job.status === "pending" || job.status === "running";
  const currentKey = isActive ? (scope.find((key) => !job.cursor[key]?.done) ?? null) : null;

  const entities = SYNC_JOB_ENTITIES.map((entity): SyncProgressEntity => {
    const bars = ENTITY_CURSOR_KEYS[entity]
      .filter((key) => scope.includes(key))
      .map((key): SyncProgressBar => {
        const entry = job.cursor[key] ?? { page: 1, done: false };
        return {
          key,
          variant: CURSOR_VARIANTS[key] ?? null,
          page: entry.page,
          done: entry.done,
          estimate: PAGE_ESTIMATES[key],
          percent: progressPercent(entry.page, entry.done, PAGE_ESTIMATES[key]),
          isCurrent: key === currentKey,
        };
      });
    return {
      key: entity,
      done: bars.every((bar) => bar.done),
      isCurrent: bars.some((bar) => bar.isCurrent),
      bars,
    };
  }).filter((entity) => entity.bars.length > 0);

  return { currentKey, entities };
}
