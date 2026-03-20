"use client";

import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

import type { AdminAchievement } from "@/types/admin-achievements";
import { Icon } from "@iconify/react";

export interface PlayerAchievementListProps {
  achievements: AdminAchievement[];
  unlockedKeys: string[];
  onAssign: (achievement: AdminAchievement) => void;
  onRevoke: (achievement: AdminAchievement) => void;
  isLoading: boolean;
}

/** Resolve the achievement name for the current locale */
function getLocalizedName(achievement: AdminAchievement, locale: string): string {
  return locale === "en" ? achievement.nameEn : achievement.nameFr;
}

export function PlayerAchievementList({
  achievements,
  unlockedKeys,
  onAssign,
  onRevoke,
  isLoading,
}: PlayerAchievementListProps) {
  const t = useTranslations("adminAchievements.playerManager");
  const locale = useLocale();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">{t("noPlayersFound")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {achievements.map((achievement) => {
        const isUnlocked = unlockedKeys.includes(achievement.key);
        const name = getLocalizedName(achievement, locale);

        return (
          <div
            key={achievement.id}
            className={`glass-card flex items-center gap-4 rounded-xl p-4 transition-all duration-300 ${
              isUnlocked
                ? "border-emerald-500/30 bg-emerald-50/30 dark:border-emerald-500/20 dark:bg-emerald-900/10"
                : "opacity-60"
            }`}
          >
            {/* Icon + status */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/50 text-lg dark:bg-slate-700/50">
              {achievement.icon}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-gray-900 dark:text-white">{name}</span>
                {isUnlocked ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <Icon icon="fa:unlock" className="h-2.5 w-2.5"  />
                    {t("unlocked")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                    <Icon icon="fa:lock" className="h-2.5 w-2.5"  />
                    {t("locked")}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {achievement.category} · {achievement.tier} · {achievement.xpValue} XP
              </p>
            </div>

            {/* Action button */}
            {isUnlocked ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRevoke(achievement)}
                className="shrink-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                {t("revoke")}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAssign(achievement)}
                className="shrink-0"
              >
                {t("assign")}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
