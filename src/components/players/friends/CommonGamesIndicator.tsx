"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@iconify/react";

interface CommonGamesIndicatorProps {
  count: number;
  isLoading: boolean;
  onClick?: () => void;
}

/**
 * Displays the number of common games between two players.
 * Rendered inside LibraryComparisonSection — only shown when
 * the current user is authenticated and viewing another player's profile.
 */
export function CommonGamesIndicator({ count, isLoading, onClick }: CommonGamesIndicatorProps) {
  const t = useTranslations("players.comparison");

  // Loading state — skeleton placeholder matching the indicator dimensions
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>
    );
  }

  // Zero common games — informational message, not clickable
  if (count === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white/60 px-4 py-3 text-gray-500 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-400">
        <Icon icon="lucide:gamepad-2" className="h-5 w-5" />
        <span className="text-sm font-medium">{t("noCommonGames")}</span>
      </div>
    );
  }

  // N common games — clickable to expand the list
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-palette-primary-500/30 bg-palette-primary-500/10 text-palette-primary-700 hover:border-palette-primary-500/50 hover:bg-palette-primary-500/20 dark:text-palette-primary-300 flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors"
    >
      <Icon icon="lucide:gamepad-2" className="h-5 w-5" />
      <span className="text-sm font-medium">{t("gamesInCommon", { count })}</span>
    </button>
  );
}
