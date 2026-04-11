"use client";

import { useTranslations } from "next-intl";
import { useGlobalSyncImport } from "@/hooks/useGlobalSyncImport";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";

export function SyncImportTab() {
  const t = useTranslations("admin.globalSync.syncTab");
  const { syncState, startSync, stopSync } = useGlobalSyncImport();

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
              <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-full animate-pulse rounded-full bg-linear-to-r from-cyan-500 to-violet-500" />
              </div>
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

        {!syncState.isSyncing && syncState.totalSynced > 0 && !syncState.error && (
          <p className="mt-3 text-sm text-green-600 dark:text-green-400">
            {t("complete", { count: syncState.totalSynced })}
          </p>
        )}
      </div>

      {/* Info card */}
      <div className="glass-card rounded-xl p-4 md:p-6">
        <div className="flex items-start gap-3">
          <Icon icon="lucide:info" className="mt-0.5 size-5 shrink-0 text-cyan-500" />
          <div className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
            <p>{t("infoResume")}</p>
            <p className="mt-1">{t("infoRetry")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
