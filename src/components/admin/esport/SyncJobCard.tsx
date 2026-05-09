"use client";

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

const ENTITY_ICONS: Record<(typeof ENTITIES)[number], string> = {
  teams: "mdi:account-group",
  tournaments: "mdi:trophy",
  players: "mdi:account",
  matches: "mdi:sword-cross",
};

interface SyncJobCardProps {
  job: SyncJob;
}

/**
 * Active full-sync progress card.
 *
 * Renders one tile per entity with its current page (a proxy for progress
 * since the Edge Function paginates 100 items per page) and a checkmark
 * once the entity is `done`. Auto-refreshed by SWR polling on the parent
 * page.
 */
export function SyncJobCard({ job }: SyncJobCardProps) {
  const t = useTranslations("admin.esport.syncPage.job");

  const isRunning = job.status === "pending" || job.status === "running";
  const startedAt = job.started_at ? new Date(job.started_at) : null;
  const elapsedMs = startedAt ? Date.now() - startedAt.getTime() : 0;
  const elapsed = formatDuration(elapsedMs);

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon
            icon={isRunning ? "mdi:loading" : "mdi:check-circle"}
            className={`text-palette-secondary-500 size-5 ${isRunning ? "animate-spin" : ""}`}
          />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {job.kind === "full" ? t("titleFull") : t("titleEntity", { entity: job.entity ?? "" })}
          </h2>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              job.status === "running"
                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                : job.status === "pending"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            }`}
          >
            {t(`status.${job.status}`)}
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {t("elapsed", { duration: elapsed })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ENTITIES.map((entity) => {
          const c = job.cursor[entity] ?? { page: 1, done: false };
          return (
            <div
              key={entity}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white/40 p-3 backdrop-blur-xl dark:border-gray-700 dark:bg-slate-800/40"
            >
              <Icon icon={ENTITY_ICONS[entity]} className="text-palette-primary-500 size-6" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {t(`entities.${entity}`)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {c.done ? t("done") : t("page", { page: c.page })}
                </p>
              </div>
              {c.done && (
                <Icon
                  icon="mdi:check-circle"
                  className="ml-auto size-5 text-green-500 dark:text-green-400"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span>{t("totalSynced", { count: job.total_synced })}</span>
        <span>{t("totalErrors", { count: job.total_errors })}</span>
        {job.last_chunk_at && (
          <span>
            {t("lastChunk", {
              date: new Date(job.last_chunk_at).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
            })}
          </span>
        )}
      </div>

      {job.error_message && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {job.error_message}
        </p>
      )}
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 0) return "0s";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec.toString().padStart(2, "0")}s`;
}
