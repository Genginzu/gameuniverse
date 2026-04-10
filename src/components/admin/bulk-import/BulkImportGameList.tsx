"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import type { BulkImportField, BulkGame, GameSyncStatus } from "@/hooks/useBulkImport";

const BATCH_SIZES = [20, 40, 60, 80, 100, 200, 400];

const STATUS_CONFIG: Record<GameSyncStatus, { icon: string; className: string }> = {
  pending: { icon: "lucide:circle-dashed", className: "text-gray-400" },
  syncing: { icon: "lucide:loader-2", className: "text-cyan-500 animate-spin" },
  success: { icon: "lucide:check-circle", className: "text-green-500" },
  error: { icon: "lucide:x-circle", className: "text-red-500" },
};

interface BulkImportGameListProps {
  games: BulkGame[];
  total: number;
  loading: boolean;
  syncing: boolean;
  batchSize: number;
  selectedField: BulkImportField;
  progress: { done: number; failed: number; total: number };
  gameStatuses: Record<string, GameSyncStatus>;
  gameErrors: Record<string, string>;
  onBatchSizeChange: (size: number) => void;
  onSync: () => void;
  onAbort: () => void;
}

export function BulkImportGameList({
  games,
  total,
  loading,
  syncing,
  batchSize,
  selectedField,
  progress,
  gameStatuses,
  gameErrors,
  onBatchSizeChange,
  onSync,
  onAbort,
}: BulkImportGameListProps) {
  const t = useTranslations("bulkImport");
  const processed = progress.done + progress.failed;

  return (
    <div className="space-y-4">
      {/* Header with batch size selector and sync button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("gamesCount", { count: total, field: t(`fields.${selectedField}`) })}
        </p>

        <div className="flex items-center gap-3">
          <label htmlFor="batch-size" className="text-sm text-gray-600 dark:text-gray-400">
            {t("batchSize")}
          </label>
          <select
            id="batch-size"
            value={batchSize}
            onChange={(e) => onBatchSizeChange(Number(e.target.value))}
            disabled={syncing}
            className="glass-input min-h-[44px] rounded-lg px-3 py-2 text-sm"
          >
            {BATCH_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>

          {syncing ? (
            <button
              onClick={onAbort}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-red-600"
            >
              <Icon icon="lucide:square" className="size-4" />
              {t("abort")}
            </button>
          ) : (
            <button
              onClick={onSync}
              disabled={games.length === 0}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
            >
              <Icon icon="lucide:download" className="size-4" />
              {t("syncButton", { count: games.length })}
            </button>
          )}
        </div>
      </div>

      {/* Progress bar during sync */}
      {syncing && progress.total > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {t("progressLabel", { done: processed, total: progress.total })}
            </span>
            <span className="font-medium">
              <span className="text-green-600 dark:text-green-400">
                {t("progressSuccess", { count: progress.done })}
              </span>
              {progress.failed > 0 && (
                <>
                  {" · "}
                  <span className="text-red-600 dark:text-red-400">
                    {t("progressFailed", { count: progress.failed })}
                  </span>
                </>
              )}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-linear-to-r from-cyan-500 to-violet-500 transition-all duration-300"
              style={{ width: `${(processed / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Game list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-2 rounded-xl p-8 text-center">
          <Icon icon="lucide:check-circle" className="size-10 text-green-500" />
          <p className="text-gray-600 dark:text-gray-400">{t("allSynced")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {games.map((game) => {
            const status = gameStatuses[game.id];
            const config = status ? STATUS_CONFIG[status] : null;

            return (
              <div
                key={game.id}
                className={`glass-card flex items-center gap-3 rounded-xl p-3 transition-all ${
                  status === "success"
                    ? "border border-green-500/30 bg-green-50/30 dark:bg-green-900/10"
                    : status === "error"
                      ? "border border-red-500/30 bg-red-50/30 dark:bg-red-900/10"
                      : status === "syncing"
                        ? "border border-cyan-500/30 bg-cyan-50/30 dark:bg-cyan-900/10"
                        : ""
                }`}
              >
                {/* Status icon or cover thumbnail */}
                {config ? (
                  <div className="flex size-10 shrink-0 items-center justify-center">
                    <Icon icon={config.icon} className={`size-6 ${config.className}`} />
                  </div>
                ) : (
                  <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                    <img
                      src={game.coverImage || "/assets/no-cover.png"}
                      alt={game.title}
                      className="size-full object-cover"
                    />
                  </div>
                )}

                {/* Game info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {game.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">IGDB #{game.igdbId}</p>
                  {status === "error" && gameErrors[game.id] && (
                    <p className="mt-0.5 truncate text-xs text-red-600 dark:text-red-400">
                      {gameErrors[game.id]}
                    </p>
                  )}
                </div>

                {/* Link to game */}
                <Link
                  href={`/games/${game.slug}`}
                  className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <Icon icon="lucide:external-link" className="size-4" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
