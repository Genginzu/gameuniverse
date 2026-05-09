"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

/**
 * The cursor on the job row uses 6 keys (matches and tournaments split
 * into past/running and upcoming/running) so each PandaScore endpoint
 * can be paginated to exhaustion independently. The UI groups them into
 * 4 logical entities for readability.
 */
type SubEntityKey =
  | "teams"
  | "tournaments_upcoming"
  | "tournaments_running"
  | "players"
  | "matches_past"
  | "matches_running";

type EntityCursor = { page: number; done: boolean };

export interface SyncJob {
  id: string;
  kind: "full" | "entity";
  entity: string | null;
  game: string | null;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  cursor: Partial<Record<SubEntityKey, EntityCursor>>;
  total_synced: number;
  total_errors: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  last_chunk_at: string | null;
  created_at: string;
}

interface SubBar {
  key: SubEntityKey;
  /** Set when a logical entity has two PandaScore endpoints (upcoming +
   *  running for tournaments, past + running for matches). */
  variantLabelKey?: "upcoming" | "running" | "past";
  /** Page count estimate used to draw the progress bar. */
  estimate: number;
}

interface LogicalEntity {
  key: "teams" | "tournaments" | "players" | "matches";
  icon: string;
  bars: SubBar[];
}

/**
 * Logical entity layout for the UI. Each logical entity renders one row
 * with one or more bars stacked side-by-side (when it spans multiple
 * PandaScore endpoints). Estimates are rough — used purely for the
 * progress bar fill, the actual "done" decision happens server-side
 * when PandaScore returns a short page.
 *
 * Numbers come from observed PandaScore traffic on the GameUniverse
 * project: ~14k teams (140 pages), ~46k players (460 pages), ~100k past
 * matches (1000 pages), and small running/upcoming feeds (<10 pages).
 */
const LOGICAL_ENTITIES: LogicalEntity[] = [
  {
    key: "teams",
    icon: "mdi:account-group",
    bars: [{ key: "teams", estimate: 150 }],
  },
  {
    key: "tournaments",
    icon: "mdi:trophy",
    bars: [
      { key: "tournaments_upcoming", variantLabelKey: "upcoming", estimate: 10 },
      { key: "tournaments_running", variantLabelKey: "running", estimate: 5 },
    ],
  },
  {
    key: "players",
    icon: "mdi:account",
    bars: [{ key: "players", estimate: 500 }],
  },
  {
    key: "matches",
    icon: "mdi:sword-cross",
    bars: [
      { key: "matches_past", variantLabelKey: "past", estimate: 1100 },
      { key: "matches_running", variantLabelKey: "running", estimate: 5 },
    ],
  },
];

interface SyncJobCardProps {
  job: SyncJob;
}

export function SyncJobCard({ job }: SyncJobCardProps) {
  const t = useTranslations("admin.esport.syncPage.job");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const isActive = job.status === "pending" || job.status === "running";
  const startedAt = job.started_at ? new Date(job.started_at).getTime() : null;
  const elapsed = startedAt ? formatDuration(now - startedAt) : "—";
  const lastChunkAgo = job.last_chunk_at
    ? formatRelative(now - new Date(job.last_chunk_at).getTime(), t)
    : null;
  const currentSubEntity = pickCurrentSubEntity(job);

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon
            icon={isActive ? "mdi:loading" : "mdi:check-circle"}
            className={`text-palette-secondary-500 size-5 ${isActive ? "animate-spin" : ""}`}
          />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {job.kind === "full"
              ? t("titleFull")
              : t("titleEntity", { entity: job.entity ?? "" })}
          </h2>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(job.status)}`}
          >
            {t(`status.${job.status}`)}
          </span>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>{t("elapsed", { duration: elapsed })}</span>
          {lastChunkAgo && (
            <span title={job.last_chunk_at ?? undefined}>
              {t("lastChunkAgo", { ago: lastChunkAgo })}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {LOGICAL_ENTITIES.map((entity) => (
          <EntityRow
            key={entity.key}
            entity={entity}
            cursor={job.cursor}
            currentSubEntity={isActive ? currentSubEntity : null}
            t={t}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {t("totalSynced", { count: job.total_synced })}
        </span>
        {job.total_errors > 0 && (
          <span className="font-medium text-red-600 dark:text-red-400">
            {t("totalErrors", { count: job.total_errors })}
          </span>
        )}
      </div>

      {(job.status === "failed" || job.error_message) && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <Icon icon="mdi:alert-circle" className="mt-0.5 size-5 shrink-0" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold">{t("errorTitle")}</p>
            <p className="text-xs leading-relaxed">
              {job.error_message ?? t("errorGeneric")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface EntityRowProps {
  entity: LogicalEntity;
  cursor: SyncJob["cursor"];
  currentSubEntity: SubEntityKey | null;
  t: ReturnType<typeof useTranslations>;
}

function EntityRow({ entity, cursor, currentSubEntity, t }: EntityRowProps) {
  const allBarsDone = entity.bars.every((b) => cursor[b.key]?.done === true);
  const isCurrentEntity = entity.bars.some((b) => b.key === currentSubEntity);

  return (
    <div className="rounded-xl border border-gray-200 bg-white/40 p-3 backdrop-blur-xl dark:border-gray-700 dark:bg-slate-800/40">
      <div className="mb-2 flex items-center gap-2">
        <Icon icon={entity.icon} className="text-palette-primary-500 size-5" />
        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
          {t(`entities.${entity.key}`)}
        </span>
        {allBarsDone ? (
          <Icon
            icon="mdi:check-circle"
            className="size-5 text-green-500 dark:text-green-400"
          />
        ) : isCurrentEntity ? (
          <Icon
            icon="mdi:loading"
            className="text-palette-secondary-500 size-4 animate-spin"
          />
        ) : null}
      </div>
      <div
        className={
          entity.bars.length > 1
            ? "grid grid-cols-1 gap-2 sm:grid-cols-2"
            : ""
        }
      >
        {entity.bars.map((bar) => (
          <SubBarRow
            key={bar.key}
            bar={bar}
            cursor={cursor[bar.key] ?? { page: 1, done: false }}
            isCurrent={bar.key === currentSubEntity}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}

function SubBarRow({
  bar,
  cursor,
  isCurrent,
  t,
}: {
  bar: SubBar;
  cursor: EntityCursor;
  isCurrent: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const completedPages = cursor.done ? bar.estimate : Math.max(0, cursor.page - 1);
  const pct = cursor.done
    ? 100
    : Math.min(99, Math.round((completedPages / bar.estimate) * 100));

  return (
    <div>
      {bar.variantLabelKey && (
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            {t(`variants.${bar.variantLabelKey}`)}
            {isCurrent && !cursor.done && (
              <Icon
                icon="mdi:loading"
                className="text-palette-secondary-500 size-3 animate-spin"
              />
            )}
          </span>
          <span className="tabular-nums text-gray-500 dark:text-gray-400">
            {cursor.done
              ? t("done")
              : t("pageProgress", { page: cursor.page, estimate: bar.estimate })}
          </span>
        </div>
      )}
      {!bar.variantLabelKey && (
        <div className="mb-1 flex justify-end text-xs">
          <span className="tabular-nums text-gray-500 dark:text-gray-400">
            {cursor.done
              ? t("done")
              : t("pageProgress", { page: cursor.page, estimate: bar.estimate })}
          </span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            cursor.done
              ? "bg-green-500"
              : "from-palette-secondary-500 to-palette-primary-500 bg-linear-to-r"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function pickCurrentSubEntity(job: SyncJob): SubEntityKey | null {
  const order: SubEntityKey[] = [
    "teams",
    "tournaments_upcoming",
    "tournaments_running",
    "players",
    "matches_past",
    "matches_running",
  ];
  for (const key of order) {
    const c = job.cursor[key];
    if (!c?.done) return key;
  }
  return null;
}

function statusClass(status: SyncJob["status"]): string {
  switch (status) {
    case "running":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "pending":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "completed":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "failed":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "cancelled":
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
  }
}

function formatDuration(ms: number): string {
  if (ms < 0) return "0s";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

function formatRelative(
  ms: number,
  t: ReturnType<typeof useTranslations>,
): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 60) return t("seconds", { count: sec });
  const m = Math.floor(sec / 60);
  if (m < 60) return t("minutes", { count: m });
  const h = Math.floor(m / 60);
  return t("hours", { count: h });
}
