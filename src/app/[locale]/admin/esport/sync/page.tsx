"use client";

import { useState, useCallback, useRef } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/shared/Pagination";
import { SyncErrorsDialog, type SyncErrorDetail } from "@/components/admin/esport/SyncErrorsDialog";

type Entity = "teams" | "players" | "tournaments" | "matches";

interface EntityState {
  status: "idle" | "fetching" | "syncing" | "done";
  done: number;
  total: number;
  current: string | null;
}

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

interface LogsResponse {
  logs: SyncLog[];
  total: number;
  totalPages: number;
}

const ENTITIES: { key: Entity; icon: string }[] = [
  { key: "teams", icon: "mdi:account-group" },
  { key: "players", icon: "mdi:account" },
  { key: "tournaments", icon: "mdi:trophy" },
  { key: "matches", icon: "mdi:sword-cross" },
];

const INITIAL: EntityState = { status: "idle", done: 0, total: 0, current: null };

export default function EsportSyncPage() {
  const t = useTranslations("admin.esport.syncPage");
  const tn = useTranslations("admin.esport");
  useAdminAuth();

  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [states, setStates] = useState<Record<Entity, EntityState>>({
    teams: INITIAL, players: INITIAL, tournaments: INITIAL, matches: INITIAL,
  });
  const abortRef = useRef<AbortController | null>(null);
  const [logPage, setLogPage] = useState(1);
  const [errorsLog, setErrorsLog] = useState<SyncLog | null>(null);

  const { data: logsData, isLoading: logsLoading, mutate } = useSWR<LogsResponse>(
    `/api/admin/esport/sync-logs?page=${logPage}&limit=10`,
    { refreshInterval: syncing ? 5000 : 0 }
  );

  const startSync = useCallback(async (entities?: Entity[]) => {
    setSyncing(true);
    setError(null);
    setStates({ teams: INITIAL, players: INITIAL, tournaments: INITIAL, matches: INITIAL });
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/admin/esport/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entities }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) { setError(t("error")); setSyncing(false); return; }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "phase") {
              setStates((prev) => ({
                ...prev,
                [evt.entity]: { ...prev[evt.entity as Entity], status: evt.status, total: evt.total ?? prev[evt.entity as Entity].total, done: evt.synced ?? prev[evt.entity as Entity].done },
              }));
            } else if (evt.type === "fetch-progress") {
              setStates((prev) => ({
                ...prev,
                [evt.entity]: { ...prev[evt.entity as Entity], current: `${evt.items} items (p.${evt.pages})` },
              }));
            } else if (evt.type === "progress") {
              setStates((prev) => ({
                ...prev,
                [evt.entity]: { ...prev[evt.entity as Entity], done: evt.done, total: evt.total, current: evt.name },
              }));
            } else if (evt.type === "error") {
              setError(evt.error);
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") setError(t("aborted"));
      else setError(t("error"));
    } finally {
      setSyncing(false);
      abortRef.current = null;
      mutate();
    }
  }, [t, mutate]);

  const pct = (s: EntityState) => s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
  const logs = logsData?.logs ?? [];
  const totalSynced = (l: SyncLog) => l.teams_synced + l.players_synced + l.tournaments_synced + l.matches_synced;
  const totalErrors = (l: SyncLog) => l.teams_errors + l.players_errors + l.tournaments_errors + l.matches_errors;
  const fmtDuration = (ms: number | null) => !ms ? "—" : ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  const fmtDate = (d: string) => new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

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

      {/* Cron info + sync button */}
      <div className="glass-card flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Icon icon="mdi:clock-outline" className="mt-0.5 size-5 text-palette-secondary-500" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{t("cronInfo")}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("cronDescription")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => startSync()}
            disabled={syncing}
            className="from-palette-secondary-500 to-palette-primary-500 min-h-[44px] bg-linear-to-r text-white"
          >
            <Icon icon={syncing ? "mdi:loading" : "mdi:cloud-download"} className={`mr-2 size-5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? t("syncing") : t("triggerSync")}
          </Button>
          {syncing && (
            <Button variant="outline" onClick={() => abortRef.current?.abort()} className="min-h-[44px]">
              <Icon icon="mdi:stop" className="mr-2 size-4" />
              {t("stop")}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Progress cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ENTITIES.map(({ key, icon }) => {
          const s = states[key];
          const isDone = s.status === "done";
          const isActive = s.status === "fetching" || s.status === "syncing";
          return (
            <div key={key} className="glass-card space-y-3 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon icon={icon} className={`size-5 ${isActive ? "text-palette-secondary-500" : isDone ? "text-green-500" : "text-gray-400"}`} />
                  <span className="font-medium text-gray-900 dark:text-white">{tn(`tabs.${key}`)}</span>
                </div>
                {!syncing && (
                  <button onClick={() => startSync([key])} className="min-h-[44px] min-w-[44px] rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200" title={t("syncOne")}>
                    <Icon icon="mdi:refresh" className="size-4" />
                  </button>
                )}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div className={`h-full rounded-full transition-all duration-300 ${isDone ? "bg-green-500" : "from-palette-secondary-500 to-palette-primary-500 bg-linear-to-r"}`} style={{ width: `${pct(s)}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {s.status === "idle" && t("idle")}
                  {s.status === "fetching" && (s.current || t("fetching"))}
                  {s.status === "syncing" && `${s.done} / ${s.total}`}
                  {s.status === "done" && t("done", { count: s.done })}
                </span>
                {isActive && s.current && <span className="max-w-[120px] truncate">{s.current}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sync history */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">{t("history")}</h2>
        <div className="glass-card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">{t("date")}</th>
                  <th className="px-4 py-3">{t("triggerCol")}</th>
                  <th className="px-4 py-3">{t("status")}</th>
                  <th className="px-4 py-3">{t("synced")}</th>
                  <th className="px-4 py-3">{t("errors")}</th>
                  <th className="px-4 py-3">{t("duration")}</th>
                  <th className="hidden px-4 py-3 lg:table-cell">{t("details")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {logsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
                    ))}</tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">{t("noLogs")}</td></tr>
                ) : logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/40 dark:hover:bg-white/5">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-900 dark:text-white">{fmtDate(log.started_at)}</td>
                    <td className="px-4 py-3">
                      <Badge className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">{log.trigger}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`rounded-full px-2 py-0.5 text-xs ${log.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : log.status === "failed" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}>{log.status}</Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-green-600 dark:text-green-400">{totalSynced(log)}</td>
                    <td className="px-4 py-3">
                      {totalErrors(log) > 0 ? (
                        log.error_details && log.error_details.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setErrorsLog(log)}
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-red-600 hover:bg-red-50 hover:underline dark:text-red-400 dark:hover:bg-red-900/20"
                            title={t("viewErrors")}
                          >
                            <Icon icon="mdi:alert-circle-outline" className="size-3.5" />
                            {totalErrors(log)}
                          </button>
                        ) : (
                          <span className="font-medium text-red-600 dark:text-red-400">{totalErrors(log)}</span>
                        )
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{fmtDuration(log.duration_ms)}</td>
                    <td className="hidden px-4 py-3 text-xs text-gray-500 lg:table-cell dark:text-gray-400">
                      {log.error_message ? <span className="text-red-500">{log.error_message}</span> : `T:${log.teams_synced} P:${log.players_synced} To:${log.tournaments_synced} M:${log.matches_synced}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {(logsData?.totalPages ?? 0) > 1 && (
          <div className="mt-4">
            <Pagination currentPage={logPage} totalPages={logsData?.totalPages ?? 0} totalCount={logsData?.total ?? 0} onPageChange={setLogPage} />
          </div>
        )}
      </div>

      {errorsLog && (
        <SyncErrorsDialog
          open={!!errorsLog}
          onOpenChange={(o) => { if (!o) setErrorsLog(null); }}
          errors={errorsLog.error_details ?? []}
          startedAt={errorsLog.started_at}
        />
      )}
    </div>
  );
}
