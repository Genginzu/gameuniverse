"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/shared/Pagination";
import { Icon } from "@iconify/react";
import { SyncProgressBar } from "./SyncProgressBar";

const IGDB_IMG = "https://images.igdb.com/igdb/image/upload";

interface SyncState {
  isSyncing: boolean;
  totalSynced: number;
  totalFailed: number;
  remaining: number;
  currentGame?: string | null;
  error?: string | null;
}

interface SyncEntry {
  id: number;
  igdb_id: number;
  name: string;
  cover_image_id: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslationFn = (key: string, values?: any) => string;

export interface SyncTabLayoutProps {
  t: TranslationFn;
  syncState: SyncState;
  onStart: () => void;
  onStop: () => void;
  startIcon: string;
  entries: SyncEntry[];
  total: number;
  totalPages: number;
  isLoading: boolean;
  page: number;
  onPageChange: (p: number) => void;
  searchInput: string;
  onSearchInputChange: (v: string) => void;
  onSearch: () => void;
  searchPlaceholder: string;
  emptyKey: string;
  showProgress?: boolean;
  renderExtraStats?: () => ReactNode;
  renderExtraErrors?: () => ReactNode;
}

export function SyncTabLayout(p: SyncTabLayoutProps) {
  const { t, syncState: s, entries } = p;
  const hasProgress = p.showProgress ?? (s.isSyncing || s.totalSynced > 0);
  const cover = (id: string | null) => (id ? `${IGDB_IMG}/t_cover_small/${id}.jpg` : null);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="glass-card rounded-xl p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg dark:text-white">{t("title")}</h3>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm dark:text-gray-400">{t("description")}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={p.onStart} disabled={s.isSyncing} className="w-full sm:w-auto">
              <Icon icon={s.isSyncing ? "svg-spinners:ring-resize" : p.startIcon} className="mr-2 size-4" />
              {s.isSyncing ? t("syncing") : t("startSync")}
            </Button>
            {s.isSyncing && (
              <Button variant="outline" onClick={p.onStop} className="w-full sm:w-auto">
                <Icon icon="lucide:square" className="mr-2 size-4" />
                {t("stop")}
              </Button>
            )}
          </div>
        </div>
        {hasProgress && (
          <div className="mt-4 space-y-3">
            {s.isSyncing && <SyncProgressBar synced={s.totalSynced} failed={s.totalFailed} remaining={s.remaining} />}
            {s.currentGame && (
              <p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">{t("currentGame", { name: s.currentGame })}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <StatBadge icon="lucide:check-circle" color="text-green-500" label={t("synced", { count: s.totalSynced })} />
              {p.renderExtraStats?.()}
              {s.totalFailed > 0 && <StatBadge icon="lucide:x-circle" color="text-red-500" label={t("failed", { count: s.totalFailed })} />}
              {s.remaining > 0 && <StatBadge icon="lucide:clock" color="text-gray-400" label={t("remaining", { count: s.remaining })} />}
            </div>
          </div>
        )}
        {s.error && <p className="mt-3 text-sm text-red-500">{s.error}</p>}
        {p.renderExtraErrors?.()}
      </div>

      <div className="flex gap-2">
        <Input value={p.searchInput} onChange={(e) => p.onSearchInputChange(e.target.value)} onKeyDown={(e) => e.key === "Enter" && p.onSearch()} placeholder={p.searchPlaceholder} className="text-base sm:text-sm" />
        <Button variant="outline" onClick={p.onSearch} className="shrink-0"><Icon icon="fa:search" className="size-4" /></Button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">{t("remaining", { count: p.total })}</p>

      {p.isLoading ? (
        <div className="space-y-2">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : entries.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-xl p-8 text-center">
          <Icon icon="lucide:check-circle-2" className="mb-3 size-10 text-green-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t(p.emptyKey)}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="glass-card flex items-center gap-3 rounded-xl p-3 md:gap-4 md:p-4">
              <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-gray-200 md:size-12 dark:bg-gray-700">
                {cover(entry.cover_image_id) ? (
                  <img src={cover(entry.cover_image_id)!} alt={entry.name} className="size-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex size-full items-center justify-center"><Icon icon="fa:gamepad" className="size-4 text-gray-400" /></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{entry.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">IGDB #{entry.igdb_id}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {p.totalPages > 1 && <Pagination currentPage={p.page} totalPages={p.totalPages} totalCount={p.total} onPageChange={p.onPageChange} />}
    </div>
  );
}

export function StatBadge({ icon, color, label }: { icon: string; color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Icon icon={icon} className={`size-4 ${color}`} />
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
    </div>
  );
}
