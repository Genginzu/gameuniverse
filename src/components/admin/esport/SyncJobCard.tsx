"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

export interface SyncJob {
  id: string;
  kind: "full" | "entity";
  entity: "teams" | "players" | "tournaments" | "matches" | null;
  game: string | null;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  cursor: Partial<
    Record<
      "teams" | "players" | "tournaments" | "matches",
      { page: number; done: boolean }
    >
  >;
  total_synced: number;
  total_errors: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  last_chunk_at: string | null;
  created_at: string;
}

const ENTITIES = ["teams", "tournaments", "players", "matches"] as const;
type Entity = (typeof ENTITIES)[number];

const ENTITY_ICONS: Record<Entity, string> = {
  teams: "mdi:account-group",
  tournaments: "mdi:trophy",
  players: "mdi:account",
  matches: "mdi:sword-cross",
};

/**
 * Rough page estimates used to draw progress bars. PandaScore returns 100
 * items per page, so these are derived from observed totals (~14k teams,
 * ~46k players, ~100k matches) plus a margin. They're advisory only — the
 * Edge Function knows the entity is done when a page returns < 100 items,
 * not when we hit the estimated page count.
 *
 * tournaments uses `runningInterleaved` because the cursor alternates
 * upcoming/running pages; both feeds are small so 10 pages cap is plenty.
 */
const PAGE_ESTIMATES: Record<Entity, number> = {
  teams: 150,
  tournaments: 10,
  players: 500,
  matches: 1100,
};

interface SyncJobCardProps {
  job: SyncJob;
}

/**
 * Active full-sync progress card.
 *
 * The Edge Function chunks page-by-page and persists the cursor between
 * chunks. We show:
 *   - which entity is currently being processed (spinner)
 *   - estimated progress bar per entity (current page / estimate)
 *   - cumulative synced / errors counters
 *   - relative time since last chunk write (so a stuck job is obvious)
 *
 * The whole component re-renders on a 1s tick so the relative time stays
 * fresh between SWR polls.
 */
export function SyncJobCard({ job }: SyncJobCardProps) {
  const t = useTranslations("admin.esport.syncPage.job");
  const [now, setNow] = useState(() => Date.now());

  // Tick every second so "elapsed" and "last chunk ago" stay live.
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

  const currentEntity = pickCurrentEntity(job);

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
        {ENTITIES.map((entity) => (
          <EntityRow
            key={entity}
            entity={entity}
            cursor={job.cursor[entity]}
            isCurrent={isActive && entity === currentEntity}
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
  entity: Entity;
  cursor: { page: number; done: boolean } | undefined;
  isCurrent: boolean;
  t: ReturnType<typeof useTranslations>;
}

function EntityRow({ entity, cursor, isCurrent, t }: EntityRowProps) {
  const c = cursor ?? { page: 1, done: false };
  const estimate = PAGE_ESTIMATES[entity];
  // page is 1-based and increments BEFORE the next page is fetched, so
  // "completed pages" is page-1 while a chunk is in progress, page when
  // done is true.
  const completedPages = c.done ? estimate : Math.max(0, c.page - 1);
  const pct = c.done
    ? 100
    : Math.min(99, Math.round((completedPages / estimate) * 100));

  return (
    <div className="rounded-xl border border-gray-200 bg-white/40 p-3 backdrop-blur-xl dark:border-gray-700 dark:bg-slate-800/40">
      <div className="mb-2 flex items-center gap-2">
        <Icon
          icon={ENTITY_ICONS[entity]}
          className="text-palette-primary-500 size-5"
        />
        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
          {t(`entities.${entity}`)}
        </span>
        {c.done ? (
          <Icon
            icon="mdi:check-circle"
            className="size-5 text-green-500 dark:text-green-400"
          />
        ) : isCurrent ? (
          <Icon
            icon="mdi:loading"
            className="text-palette-secondary-500 size-4 animate-spin"
          />
        ) : null}
        <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
          {c.done
            ? t("done")
            : t("pageProgress", { page: c.page, estimate })}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            c.done
              ? "bg-green-500"
              : "from-palette-secondary-500 to-palette-primary-500 bg-linear-to-r"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function pickCurrentEntity(job: SyncJob): Entity | null {
  for (const e of ENTITIES) {
    const c = job.cursor[e];
    if (!c?.done) return e;
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
