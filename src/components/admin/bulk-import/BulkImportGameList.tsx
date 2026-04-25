"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { BulkImportField, BulkGame, GameSyncStatus } from "@/hooks/useBulkImport";
import type { CharacterImportField } from "@/hooks/useBulkImportCharacters";
import { BulkImportGameRow } from "./BulkImportGameRow";

const BATCH_SIZES = [20, 40, 60, 80, 100, 200, 400];

interface BulkImportGameListProps {
  games: BulkGame[];
  total: number;
  loading: boolean;
  syncing: boolean;
  batchSize: number;
  selectedField: BulkImportField | CharacterImportField;
  progress: { done: number; failed: number; total: number };
  gameStatuses: Record<string, GameSyncStatus>;
  gameErrors: Record<string, string>;
  onBatchSizeChange: (size: number) => void;
  onSync: () => void;
  onAbort: () => void;
}

export function BulkImportGameList({ games, total, loading, syncing, batchSize, selectedField, progress, gameStatuses, gameErrors, onBatchSizeChange, onSync, onAbort }: BulkImportGameListProps) {
  const t = useTranslations("bulkImport");
  const processed = progress.done + progress.failed;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">{t("gamesCount", { count: total, field: t(`fields.${selectedField}`) })}</p>
        <div className="flex items-center gap-3">
          <label htmlFor="batch-size" className="text-sm text-gray-600 dark:text-gray-400">{t("batchSize")}</label>
          <select id="batch-size" value={batchSize} onChange={(e) => onBatchSizeChange(Number(e.target.value))} disabled={syncing} className="glass-input min-h-[44px] rounded-lg px-3 py-2 text-sm">
            {BATCH_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
            <option value={0}>{t("all")}</option>
          </select>
          {syncing ? (
            <button onClick={onAbort} className="flex min-h-[44px] items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-red-600"><Icon icon="lucide:square" className="size-4" />{t("abort")}</button>
          ) : (
            <button onClick={onSync} disabled={games.length === 0} className="flex min-h-[44px] items-center gap-2 rounded-xl bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"><Icon icon="lucide:download" className="size-4" />{t("syncButton", { count: batchSize === 0 ? total : games.length })}</button>
          )}
        </div>
      </div>

      {syncing && progress.total > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{t("progressLabel", { done: processed, total: progress.total })}</span>
            <span className="font-medium">
              <span className="text-green-600 dark:text-green-400">{t("progressSuccess", { count: progress.done })}</span>
              {progress.failed > 0 && <>{" · "}<span className="text-red-600 dark:text-red-400">{t("progressFailed", { count: progress.failed })}</span></>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-full rounded-full bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 transition-all duration-300" style={{ width: `${(processed / progress.total) * 100}%` }} />
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />)}</div>
      ) : games.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-2 rounded-xl p-8 text-center"><Icon icon="lucide:check-circle" className="size-10 text-green-500" /><p className="text-gray-600 dark:text-gray-400">{t("allSynced")}</p></div>
      ) : (
        <div className="space-y-2">
          {games.map((game) => <BulkImportGameRow key={game.id} game={game} status={gameStatuses[game.id]} errorMsg={gameErrors[game.id]} />)}
        </div>
      )}
    </div>
  );
}
