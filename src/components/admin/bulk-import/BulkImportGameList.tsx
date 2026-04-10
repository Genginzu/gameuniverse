"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import type { BulkImportField } from "@/hooks/useBulkImport";

interface BulkGame {
  id: string;
  slug: string;
  igdbId: number;
  title: string;
  coverImage: string | null;
}

const BATCH_SIZES = [20, 40, 60, 80, 100, 200, 400];

interface BulkImportGameListProps {
  games: BulkGame[];
  total: number;
  loading: boolean;
  syncing: boolean;
  batchSize: number;
  selectedField: BulkImportField;
  progress: { done: number; total: number };
  onBatchSizeChange: (size: number) => void;
  onSync: () => void;
}

export function BulkImportGameList({
  games,
  total,
  loading,
  syncing,
  batchSize,
  selectedField,
  progress,
  onBatchSizeChange,
  onSync,
}: BulkImportGameListProps) {
  const t = useTranslations("bulkImport");

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

          <button
            onClick={onSync}
            disabled={syncing || games.length === 0}
            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
          >
            {syncing ? (
              <>
                <Icon icon="lucide:loader-2" className="size-4 animate-spin" />
                {t("syncing", { done: progress.done, total: progress.total })}
              </>
            ) : (
              <>
                <Icon icon="lucide:download" className="size-4" />
                {t("syncButton", { count: games.length })}
              </>
            )}
          </button>
        </div>
      </div>

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
          {games.map((game) => (
            <div
              key={game.id}
              className="glass-card flex items-center gap-3 rounded-xl p-3 transition-all"
            >
              {/* Cover thumbnail */}
              <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                {game.coverImage ? (
                  <img src={game.coverImage} alt={game.title} className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <Icon icon="lucide:image-off" className="size-5 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Game info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {game.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">IGDB #{game.igdbId}</p>
              </div>

              {/* Link to game */}
              <Link
                href={`/games/${game.slug}`}
                className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
              >
                <Icon icon="lucide:external-link" className="size-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
