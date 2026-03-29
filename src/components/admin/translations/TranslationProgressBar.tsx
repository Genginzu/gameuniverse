"use client";

import { useTranslations } from "next-intl";

interface TranslationProgressBarProps {
  translated: number;
  total: number;
}

export function TranslationProgressBar({ translated, total }: TranslationProgressBarProps) {
  const t = useTranslations("admin.translations");
  const percentage = total > 0 ? Math.round((translated / total) * 100) : 100;

  return (
    <div className="glass-card rounded-2xl p-6 transition-all duration-300">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("batch.progress")}
        </h3>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{percentage}%</span>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200/60 dark:bg-slate-700/60">
        <div
          className="h-full rounded-full bg-linear-to-r from-cyan-500 to-violet-500 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {translated} / {total} {t("stats.translated").toLowerCase()}
      </p>
    </div>
  );
}
