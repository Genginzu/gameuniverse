"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useGlobalSyncImport } from "@/hooks/useGlobalSyncImport";
import { useGlobalSync } from "@/hooks/useGlobalSync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/shared/Pagination";
import { Icon } from "@iconify/react";
import { SyncProgressBar } from "./SyncProgressBar";

const IGDB_IMAGE_BASE = "https://images.igdb.com/igdb/image/upload";

export function SyncImportTab() {
  const t = useTranslations("admin.globalSync.syncTab");
  const tCommon = useTranslations("admin.globalSync");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { entries, total, totalPages, isLoading, refresh } = useGlobalSync(
    page,
    search,
    "unsynced"
  );
  const { syncState, startSync, stopSync } = useGlobalSyncImport(refresh);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const coverUrl = (imageId: string | null) =>
    imageId ? `${IGDB_IMAGE_BASE}/t_cover_small/${imageId}.jpg` : null;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Sync control */}
      <div className="glass-card rounded-xl p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg dark:text-white">
              {t("title")}
            </h3>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm dark:text-gray-400">
              {t("description")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={startSync} disabled={syncState.isSyncing} className="w-full sm:w-auto">
              <Icon
                icon={syncState.isSyncing ? "svg-spinners:ring-resize" : "lucide:play"}
                className="mr-2 size-4"
              />
              {syncState.isSyncing ? t("syncing") : t("startSync")}
            </Button>
            {syncState.isSyncing && (
              <Button variant="outline" onClick={stopSync} className="w-full sm:w-auto">
                <Icon icon="lucide:square" className="mr-2 size-4" />
                {t("stop")}
              </Button>
            )}
          </div>
        </div>

        {/* Progress */}
        {(syncState.isSyncing || syncState.totalSynced > 0 || syncState.totalFailed > 0) && (
          <div className="mt-4 space-y-3">
            {syncState.isSyncing && (
              <SyncProgressBar
                synced={syncState.totalSynced}
                failed={syncState.totalFailed}
                remaining={syncState.remaining}
              />
            )}
            {syncState.currentGame && (
              <p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                {t("currentGame", { name: syncState.currentGame })}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-sm">
                <Icon icon="lucide:check-circle" className="size-4 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  {t("synced", { count: syncState.totalSynced })}
                </span>
              </div>
              {syncState.totalFailed > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Icon icon="lucide:x-circle" className="size-4 text-red-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("failed", { count: syncState.totalFailed })}
                  </span>
                </div>
              )}
              {syncState.remaining > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Icon icon="lucide:clock" className="size-4 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("remaining", { count: syncState.remaining })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        {syncState.error && <p className="mt-3 text-sm text-red-500">{syncState.error}</p>}
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tCommon("searchPlaceholder")}
          className="text-base sm:text-sm"
        />
        <Button variant="outline" onClick={handleSearch} className="shrink-0">
          <Icon icon="fa:search" className="size-4" />
        </Button>
      </div>

      {/* Stats */}
      <p className="text-sm text-gray-500 dark:text-gray-400">{t("remaining", { count: total })}</p>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-xl p-8 text-center">
          <Icon icon="lucide:check-circle-2" className="mb-3 size-10 text-green-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("allSynced")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="glass-card flex items-center gap-3 rounded-xl p-3 md:gap-4 md:p-4"
            >
              <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-gray-200 md:size-12 dark:bg-gray-700">
                {coverUrl(entry.cover_image_id) ? (
                  <img
                    src={coverUrl(entry.cover_image_id)!}
                    alt={entry.name}
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <Icon icon="fa:gamepad" className="size-4 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {entry.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">IGDB #{entry.igdb_id}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
