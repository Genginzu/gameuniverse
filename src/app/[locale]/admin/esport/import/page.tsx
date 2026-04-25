"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";

type Entity = "teams" | "players" | "tournaments" | "matches";

interface EntityState {
  status: "idle" | "fetching" | "syncing" | "done";
  done: number;
  total: number;
  current: string | null;
}

const ENTITIES: { key: Entity; icon: string }[] = [
  { key: "teams", icon: "mdi:account-group" },
  { key: "players", icon: "mdi:account" },
  { key: "tournaments", icon: "mdi:trophy" },
  { key: "matches", icon: "mdi:sword-cross" },
];

const INITIAL: EntityState = { status: "idle", done: 0, total: 0, current: null };

export default function EsportImportPage() {
  const t = useTranslations("admin.esport.import");
  const tn = useTranslations("admin.esport");
  useAdminAuth();

  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [states, setStates] = useState<Record<Entity, EntityState>>({
    teams: INITIAL, players: INITIAL, tournaments: INITIAL, matches: INITIAL,
  });
  const abortRef = useRef<AbortController | null>(null);

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

      if (!res.ok || !res.body) {
        setError(t("error"));
        setSyncing(false);
        return;
      }

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
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(t("aborted"));
      } else {
        setError(t("error"));
      }
    } finally {
      setSyncing(false);
      abortRef.current = null;
    }
  }, [t]);

  const pct = (s: EntityState) => s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;

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

      {/* Sync all button */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => startSync()}
          disabled={syncing}
          className="from-palette-secondary-500 to-palette-primary-500 min-h-[44px] bg-linear-to-r text-white"
        >
          <Icon icon={syncing ? "mdi:loading" : "mdi:cloud-download"} className={`mr-2 size-5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? t("syncing") : t("syncAll")}
        </Button>
        {syncing && (
          <Button variant="outline" onClick={() => abortRef.current?.abort()} className="min-h-[44px]">
            <Icon icon="mdi:stop" className="mr-2 size-4" />
            {t("stop")}
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Entity cards */}
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
                  <button
                    onClick={() => startSync([key])}
                    className="min-h-[44px] min-w-[44px] rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    title={t("syncOne")}
                  >
                    <Icon icon="mdi:refresh" className="size-4" />
                  </button>
                )}
              </div>

              {/* Progress bar */}
              <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isDone ? "bg-green-500" : "from-palette-secondary-500 to-palette-primary-500 bg-linear-to-r"}`}
                  style={{ width: `${pct(s)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {s.status === "idle" && t("idle")}
                  {s.status === "fetching" && t("fetching")}
                  {s.status === "syncing" && `${s.done} / ${s.total}`}
                  {s.status === "done" && t("done", { count: s.done })}
                </span>
                {isActive && s.current && (
                  <span className="max-w-[120px] truncate">{s.current}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
