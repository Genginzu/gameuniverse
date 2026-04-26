"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

interface TranslationBatchProgressProps {
  processed: number;
  total: number;
  succeeded: number;
  failed: number;
  isRunning: boolean;
  onCancel: () => void;
}

export function TranslationBatchProgress({
  processed,
  total,
  succeeded,
  failed,
  isRunning,
  onCancel,
}: TranslationBatchProgressProps) {
  const t = useTranslations("admin.translations");
  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
  const isComplete = !isRunning && processed > 0;

  return (
    <div className="glass-card rounded-2xl p-5 transition-all duration-300">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isRunning && (
            <Icon icon="mdi:loading" className="text-palette-secondary-500 size-4 animate-spin" />
          )}
          {isComplete && <Icon icon="mdi:check-circle" className="size-4 text-emerald-500" />}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isRunning
              ? t("batch.processing")
              : isComplete
                ? t("batch.completed")
                : t("batch.progress")}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {processed}/{total}
          </span>
          {isRunning && (
            <button
              onClick={onCancel}
              className="rounded-lg px-3 py-1 text-xs font-medium text-red-600 transition-all duration-300 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              {t("buttons.cancel")}
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200/60 dark:bg-slate-700/60">
        <div
          className="from-palette-secondary-500 to-palette-primary-500 h-full rounded-full bg-linear-to-r transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Summary (shown when there's progress) */}
      {processed > 0 && (
        <div className="mt-3 flex gap-4 text-xs">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Icon icon="mdi:check" className="size-3.5" />
            {t("batch.succeeded")}: {succeeded}
          </span>
          {failed > 0 && (
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <Icon icon="mdi:close" className="size-3.5" />
              {t("batch.failed")}: {failed}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
