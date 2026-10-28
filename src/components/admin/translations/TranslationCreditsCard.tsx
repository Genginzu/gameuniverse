"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { GatewayCredits } from "@/types/admin-translations";

interface TranslationCreditsCardProps {
  credits: GatewayCredits | null;
  isLoading: boolean;
  isRefreshing: boolean;
  format: (value: number) => string;
  onRefresh: () => void;
}

/** Remaining Vercel AI Gateway credits. */
export function TranslationCreditsCard({
  credits,
  isLoading,
  isRefreshing,
  format,
  onRefresh,
}: TranslationCreditsCardProps) {
  const t = useTranslations("admin.translations.ai");

  return (
    <div className="glass-card rounded-2xl p-4 transition-all duration-300 md:p-6">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Icon icon="mdi:wallet-outline" className="size-4" />
          {t("creditsLabel")}
        </h3>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label={t("refreshCredits")}
          aria-busy={isRefreshing}
          className="border-palette-secondary-500/30 text-palette-secondary-600 hover:bg-palette-secondary-50 dark:text-palette-secondary-400 dark:hover:bg-palette-secondary-900/20 inline-flex size-12 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 active:scale-90 disabled:cursor-wait"
        >
          <Icon
            icon="mdi:refresh"
            className={`size-6 transition-transform ${isRefreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {isLoading ? (
        <div className="h-8 w-28 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
      ) : credits ? (
        <div
          className={`transition-opacity duration-300 ${isRefreshing ? "animate-pulse opacity-50" : ""}`}
        >
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {format(credits.balance)}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("creditsUsed", { amount: format(credits.totalUsed) })}
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("creditsUnavailable")}</p>
      )}
    </div>
  );
}
