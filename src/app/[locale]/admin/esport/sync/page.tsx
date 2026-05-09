"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/Pagination";
import { SyncErrorsDialog, type SyncErrorDetail } from "@/components/admin/esport/SyncErrorsDialog";
import { SyncJobCard, type SyncJob } from "@/components/admin/esport/SyncJobCard";

interface SyncHistoryEntry {
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
  error_details: SyncErrorDetail[] | null;
  entity?: string | null;
}

interface HistoryResponse { entries: SyncHistoryEntry[]; total: number; totalPages: number }
interface JobsResponse { jobs: SyncJob[] }

export default function EsportSyncPage() {
  const t = useTranslations("admin.esport.syncPage");
  const tn = useTranslations("admin.esport");
  useAdminAuth();

  const [incrementalSyncing, setIncrementalSyncing] = useState(false);
  const [fullSyncStarting, setFullSyncStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [errorsEntry, setErrorsEntry] = useState<SyncHistoryEntry | null>(null);

  // Adaptive polling: 2s while a job is active, 10s otherwise.
  const { data: jobsData, mutate: mutateJobs } = useSWR<JobsResponse>(
    "/api/admin/esport/sync-jobs?limit=10",
    {
      refreshInterval: (latest) => {
        const hasActive = (latest?.jobs ?? []).some(
          (j) => j.status === "pending" || j.status === "running",
        );
        return hasActive ? 2000 : 10000;
      },
    },
  );
  const jobs = jobsData?.jobs ?? [];
  const activeJob = jobs.find((j) => j.status === "pending" || j.status === "running") ?? null;

  // Unified history (incremental sync_logs + full sync_jobs).
  const { data: historyData, isLoading: historyLoading, mutate: mutateHistory } = useSWR<HistoryResponse>(
    `/api/admin/esport/sync-history?page=${historyPage}&limit=10`,
    { refreshInterval: 30000 },
  );

  const runIncrementalSync = useCallback(async () => {
    setIncrementalSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/esport/incremental-sync", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? t("error"));
      }
      mutateHistory();
    } catch {
      setError(t("error"));
    } finally {
      setIncrementalSyncing(false);
    }
  }, [t, mutateHistory]);

  const startFullSync = useCallback(async () => {
    setFullSyncStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/esport/full-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? t("error"));
      }
      mutateJobs();
      mutateHistory();
    } catch {
      setError(t("error"));
    } finally {
      setFullSyncStarting(false);
    }
  }, [t, mutateJobs, mutateHistory]);

  const entries = historyData?.entries ?? [];
  const fmtDuration = (ms: number | null) =>
    !ms ? "—" : ms < 1000 ? `${ms}ms` : ms < 60000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  const fmtDate = (d: string) => new Date(d).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div>
        <Link href="/admin/esport" className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <Icon icon="lucide:arrow-left" className="size-4" />
          {tn("title")}
        </Link>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
      </div>

      {/* Sync controls */}
      <div className="glass-card flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Icon icon="mdi:clock-outline" className="text-palette-secondary-500 mt-0.5 size-5" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{t("cronInfo")}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("cronDescription")}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={runIncrementalSync}
            disabled={incrementalSyncing || Boolean(activeJob)}
            className="min-h-[44px]"
            title={t("triggerIncrementalSyncDescription")}
          >
            <Icon
              icon={incrementalSyncing ? "mdi:loading" : "mdi:refresh"}
              className={`mr-2 size-5 ${incrementalSyncing ? "animate-spin" : ""}`}
            />
            {incrementalSyncing ? t("syncing") : t("triggerIncrementalSync")}
          </Button>
          <Button
            onClick={startFullSync}
            disabled={fullSyncStarting || Boolean(activeJob)}
            className="from-palette-secondary-500 to-palette-primary-500 min-h-[44px] bg-linear-to-r text-white"
            title={t("triggerFullSyncDescription")}
          >
            <Icon
              icon={fullSyncStarting ? "mdi:loading" : "mdi:cloud-download"}
              className={`mr-2 size-5 ${fullSyncStarting ? "animate-spin" : ""}`}
            />
            {fullSyncStarting ? t("starting") : t("triggerSync")}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Active full-sync job */}
      {activeJob && <SyncJobCard job={activeJob} />}

      {/* Unified history */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t("history")}</h2>
        {historyLoading && entries.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("fetching")}</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("noLogs")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="px-3 py-2 font-medium">{t("date")}</th>
                  <th className="px-3 py-2 font-medium">{t("kind")}</th>
                  <th className="px-3 py-2 font-medium">{t("triggerCol")}</th>
                  <th className="px-3 py-2 font-medium">{t("status")}</th>
                  <th className="px-3 py-2 font-medium">{t("synced")}</th>
                  <th className="px-3 py-2 font-medium">{t("errors")}</th>
                  <th className="px-3 py-2 font-medium">{t("duration")}</th>
                  <th className="px-3 py-2 font-medium">{t("details")}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {fmtDate(entry.started_at)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          entry.kind === "full"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        }`}
                      >
                        {t(`kindLabel.${entry.kind}`)}
                        {entry.entity && ` (${entry.entity})`}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {entry.trigger}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          entry.status === "completed"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : entry.status === "failed"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : entry.status === "running" || entry.status === "pending"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300 tabular-nums">
                      {entry.total_synced.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300 tabular-nums">
                      {entry.total_errors.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {fmtDuration(entry.duration_ms)}
                    </td>
                    <td className="px-3 py-2">
                      {entry.error_details && entry.error_details.length > 0 && (
                        <button
                          type="button"
                          className="text-palette-primary-600 hover:underline"
                          onClick={() => setErrorsEntry(entry)}
                        >
                          {t("viewErrors")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {historyData && historyData.totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={historyPage}
                  totalPages={historyData.totalPages}
                  onPageChange={setHistoryPage}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {errorsEntry && (
        <SyncErrorsDialog
          open={true}
          onOpenChange={(o) => {
            if (!o) setErrorsEntry(null);
          }}
          errors={errorsEntry.error_details ?? []}
          startedAt={errorsEntry.started_at}
        />
      )}
    </div>
  );
}
