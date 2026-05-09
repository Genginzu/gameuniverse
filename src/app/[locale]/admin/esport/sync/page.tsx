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

interface SyncLog {
  id: string;
  trigger: string;
  status: string;
  teams_synced: number;
  teams_errors: number;
  players_synced: number;
  players_errors: number;
  tournaments_synced: number;
  tournaments_errors: number;
  matches_synced: number;
  matches_errors: number;
  error_message: string | null;
  error_details: SyncErrorDetail[] | null;
  duration_ms: number | null;
  started_at: string;
}

interface LogsResponse { logs: SyncLog[]; total: number; totalPages: number }
interface JobsResponse { jobs: SyncJob[] }

export default function EsportSyncPage() {
  const t = useTranslations("admin.esport.syncPage");
  const tn = useTranslations("admin.esport");
  useAdminAuth();

  const [incrementalSyncing, setIncrementalSyncing] = useState(false);
  const [fullSyncStarting, setFullSyncStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logPage, setLogPage] = useState(1);
  const [errorsLog, setErrorsLog] = useState<SyncLog | null>(null);

  const { data: jobsData, mutate: mutateJobs } = useSWR<JobsResponse>(
    "/api/admin/esport/sync-jobs?limit=10",
    { refreshInterval: 5000 },
  );
  const jobs = jobsData?.jobs ?? [];
  const activeJob = jobs.find((j) => j.status === "pending" || j.status === "running") ?? null;

  const { data: logsData, isLoading: logsLoading, mutate: mutateLogs } = useSWR<LogsResponse>(
    `/api/admin/esport/sync-logs?page=${logPage}&limit=10`,
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
      mutateLogs();
    } catch {
      setError(t("error"));
    } finally {
      setIncrementalSyncing(false);
    }
  }, [t, mutateLogs]);

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
    } catch {
      setError(t("error"));
    } finally {
      setFullSyncStarting(false);
    }
  }, [t, mutateJobs]);

  const logs = logsData?.logs ?? [];
  const totalSynced = (l: SyncLog) => l.teams_synced + l.players_synced + l.tournaments_synced + l.matches_synced;
  const totalErrors = (l: SyncLog) => l.teams_errors + l.players_errors + l.tournaments_errors + l.matches_errors;
  const fmtDuration = (ms: number | null) => !ms ? "—" : ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
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

      {/* History */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t("history")}</h2>
        {logsLoading && logs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("fetching")}</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("noLogs")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="px-3 py-2 font-medium">{t("date")}</th>
                  <th className="px-3 py-2 font-medium">{t("triggerCol")}</th>
                  <th className="px-3 py-2 font-medium">{t("status")}</th>
                  <th className="px-3 py-2 font-medium">{t("synced")}</th>
                  <th className="px-3 py-2 font-medium">{t("errors")}</th>
                  <th className="px-3 py-2 font-medium">{t("duration")}</th>
                  <th className="px-3 py-2 font-medium">{t("details")}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{fmtDate(log.started_at)}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{log.trigger}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          log.status === "completed"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : log.status === "failed"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{totalSynced(log)}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{totalErrors(log)}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{fmtDuration(log.duration_ms)}</td>
                    <td className="px-3 py-2">
                      {log.error_details && log.error_details.length > 0 && (
                        <button
                          type="button"
                          className="text-palette-primary-600 hover:underline"
                          onClick={() => setErrorsLog(log)}
                        >
                          {t("viewErrors")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logsData && logsData.totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={logPage}
                  totalPages={logsData.totalPages}
                  onPageChange={setLogPage}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {errorsLog && (
        <SyncErrorsDialog
          isOpen={true}
          onClose={() => setErrorsLog(null)}
          errors={errorsLog.error_details ?? []}
        />
      )}
    </div>
  );
}
