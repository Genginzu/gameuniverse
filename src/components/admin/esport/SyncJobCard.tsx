"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { buildSyncProgressView } from "@/lib/pandascore/sync-progress";
import type { SyncJob } from "@/types/esport-sync";
import { SyncJobEntityRow } from "@/components/admin/esport/SyncJobEntityRow";

type Translator = ReturnType<typeof useTranslations>;

const STATUS_CLASSES: Record<SyncJob["status"], string> = {
  running: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  pending: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

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
  const progress = buildSyncProgressView(job);

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon
            icon={isActive ? "mdi:loading" : "mdi:check-circle"}
            className={`text-palette-secondary-500 size-5 ${isActive ? "animate-spin" : ""}`}
          />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {job.kind === "full" ? t("titleFull") : t("titleEntity", { entity: job.entity ?? "" })}
          </h2>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[job.status]}`}>
            {t(`status.${job.status}`)}
          </span>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>{t("elapsed", { duration: elapsed })}</span>
          {lastChunkAgo && (
            <span title={job.last_chunk_at ?? undefined}>{t("lastChunkAgo", { ago: lastChunkAgo })}</span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {progress.entities.map((entity) => (
          <SyncJobEntityRow key={entity.key} entity={entity} t={t} />
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
            <p className="text-xs leading-relaxed">{job.error_message ?? t("errorGeneric")}</p>
          </div>
        </div>
      )}
    </div>
  );
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

function formatRelative(ms: number, t: Translator): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 60) return t("seconds", { count: sec });
  const m = Math.floor(sec / 60);
  if (m < 60) return t("minutes", { count: m });
  const h = Math.floor(m / 60);
  return t("hours", { count: h });
}
