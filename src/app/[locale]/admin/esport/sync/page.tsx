"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/shared/Pagination";

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
  duration_ms: number | null;
  started_at: string;
  completed_at: string | null;
}

interface LogsResponse {
  logs: SyncLog[];
  total: number;
  page: number;
  totalPages: number;
}

export default function EsportSyncPage() {
  const t = useTranslations("admin.esport.syncPage");
  const tn = useTranslations("admin.esport");
  useAdminAuth();

  const [page, setPage] = useState(1);
  const [syncing, setSyncing] = useState(false);

  const { data, isLoading, mutate } = useSWR<LogsResponse>(
    `/api/admin/esport/sync-logs?page=${page}&limit=20`,
    { refreshInterval: syncing ? 5000 : 0 }
  );

  const triggerSync = useCallback(async () => {
    setSyncing(true);
    try {
      await fetch("/api/cron/esport-sync?trigger=manual", { method: "POST" });
      mutate();
    } catch {
      // error handled by logs
    } finally {
      setSyncing(false);
      mutate();
    }
  }, [mutate]);

  const logs = data?.logs ?? [];
  const totalPages = data?.totalPages ?? 0;

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      running: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return <Badge className={`rounded-full px-2 py-0.5 text-xs ${colors[status] ?? ""}`}>{status}</Badge>;
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "—";
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const totalSynced = (log: SyncLog) =>
    log.teams_synced + log.players_synced + log.tournaments_synced + log.matches_synced;

  const totalErrors = (log: SyncLog) =>
    log.teams_errors + log.players_errors + log.tournaments_errors + log.matches_errors;

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <Link
          href="/admin/esport"
          className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Icon icon="lucide:arrow-left" className="size-4" />
          {tn("title")}
        </Link>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
      </div>

      {/* Info card */}
      <div className="glass-card flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Icon icon="mdi:clock-outline" className="mt-0.5 size-5 text-palette-secondary-500" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{t("cronInfo")}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("cronDescription")}</p>
          </div>
        </div>
        <Button
          onClick={triggerSync}
          disabled={syncing}
          className="from-palette-secondary-500 to-palette-primary-500 min-h-[44px] w-full bg-linear-to-r text-white sm:w-auto"
        >
          <Icon icon={syncing ? "mdi:loading" : "mdi:refresh"} className={`mr-2 size-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? t("syncing") : t("triggerSync")}
        </Button>
      </div>

      {/* Logs table */}
      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">{t("date")}</th>
                <th className="px-4 py-3">{t("trigger")}</th>
                <th className="px-4 py-3">{t("status")}</th>
                <th className="px-4 py-3">{t("synced")}</th>
                <th className="px-4 py-3">{t("errors")}</th>
                <th className="px-4 py-3">{t("duration")}</th>
                <th className="hidden px-4 py-3 lg:table-cell">{t("details")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    {t("noLogs")}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-900 dark:text-white">
                      {formatDate(log.started_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {log.trigger}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{statusBadge(log.status)}</td>
                    <td className="px-4 py-3 font-medium text-green-600 dark:text-green-400">
                      {totalSynced(log)}
                    </td>
                    <td className="px-4 py-3">
                      {totalErrors(log) > 0 ? (
                        <span className="font-medium text-red-600 dark:text-red-400">{totalErrors(log)}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {formatDuration(log.duration_ms)}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-gray-500 lg:table-cell dark:text-gray-400">
                      {log.error_message ? (
                        <span className="text-red-500">{log.error_message}</span>
                      ) : (
                        `T:${log.teams_synced} P:${log.players_synced} To:${log.tournaments_synced} M:${log.matches_synced}`
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
