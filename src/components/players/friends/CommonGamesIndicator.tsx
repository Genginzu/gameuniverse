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
      <div className="editorial-common-games">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>
    );
  }

  // Zero common games — informational message, not clickable
  if (count === 0) {
    return (
      <div className="editorial-common-games">
        <Icon icon="lucide:gamepad-2" className="h-5 w-5" />
        <span>{t("noCommonGames")}</span>
      </div>
    );
  }

  // N common games — clickable to expand the list
  return (
    <button
      type="button"
      onClick={onClick}
      className="editorial-common-games editorial-common-games--button"
    >
      <Icon icon="lucide:gamepad-2" className="h-5 w-5" />
      <span>{t("gamesInCommon", { count })}</span>
    </button>
  );
}
