"use client";

import { useTranslations } from "next-intl";
import { useGlobalMetascoreSync } from "@/hooks/useGlobalMetascoreSync";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";

export function MetascoreSyncTab() {
  const t = useTranslations("admin.globalSync.metascoreTab");
  const { metascoreState, startMetascoreSync, stopMetascoreSync } = useGlobalMetascoreSync();

  return (
    <div className="space-y-4 md:space-y-6">
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
            <Button
              onClick={startMetascoreSync}
              disabled={metascoreState.isSyncing}
              className="w-full sm:w-auto"
            >
              <Icon
                icon={metascoreState.isSyncing ? "svg-spinners:ring-resize" : "lucide:star"}
                className="mr-2 size-4"
              />
              {metascoreState.isSyncing ? t("syncing") : t("startSync")}
            </Button>
            {metascoreState.isSyncing && (
              <Button variant="outline" onClick={stopMetascoreSync} className="w-full sm:w-auto">
                <Icon icon="lucide:square" className="mr-2 size-4" />
                {t("stop")}
              </Button>
            )}
          </div>
        </div>

        {(metascoreState.isSyncing || metascoreState.totalSynced > 0) && (
          <div className="mt-4 space-y-3">
            {metascoreState.isSyncing && (
              <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-full animate-pulse rounded-full bg-linear-to-r from-cyan-500 to-violet-500" />
              </div>
            )}
            {metascoreState.currentGame && (
              <p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                {t("currentGame", { name: metascoreState.currentGame })}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-sm">
                <Icon icon="lucide:check-circle" className="size-4 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  {t("synced", { count: metascoreState.totalSynced })}
                </span>
              </div>
              {metascoreState.totalFailed > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Icon icon="lucide:x-circle" className="size-4 text-red-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("failed", { count: metascoreState.totalFailed })}
                  </span>
                </div>
              )}
              {metascoreState.remaining > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Icon icon="lucide:clock" className="size-4 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("remaining", { count: metascoreState.remaining })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {metascoreState.error && (
          <p className="mt-3 text-sm text-red-500">{metascoreState.error}</p>
        )}

        {!metascoreState.isSyncing && metascoreState.totalSynced > 0 && !metascoreState.error && (
          <p className="mt-3 text-sm text-green-600 dark:text-green-400">
            {t("complete", { count: metascoreState.totalSynced })}
          </p>
        )}
      </div>

      {/* Info */}
      <div className="glass-card rounded-xl p-4 md:p-6">
        <div className="flex items-start gap-3">
          <Icon icon="lucide:info" className="mt-0.5 size-5 shrink-0 text-cyan-500" />
          <div className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
            <p>{t("info")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
