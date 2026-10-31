"use client";

import { useLocale, useTranslations } from "next-intl";
import type { PlayerAchievementWithDetails } from "@/types/achievement";
import { Icon } from "@iconify/react";
import { resolveAchievementIcon } from "@/lib/utils/achievementIcon";

const TIER_STYLES = {
  bronze: {
    bg: "bg-orange-700/20",
    text: "text-orange-300",
    border: "border-orange-500/40",
  },
  silver: {
    bg: "bg-white/10",
    text: "text-zinc-200",
    border: "border-zinc-300/40",
  },
  gold: {
    bg: "bg-yellow-500/15",
    text: "text-yellow-300",
    border: "border-yellow-400/50",
  },
} as const;

interface AchievementCardProps {
  achievement: PlayerAchievementWithDetails;
}

function formatUnlockDate(isoDate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(isoDate));
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const t = useTranslations("achievements");
  const locale = useLocale();

  const isUnlocked = achievement.unlockedAt !== null;
  const iconName = resolveAchievementIcon(achievement.icon);
  const tierStyle = TIER_STYLES[achievement.tier];

  return (
    <div
      className={`glass-card rounded-lg p-4 transition-all duration-300 ${
        isUnlocked ? "" : "opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            isUnlocked
              ? "from-palette-primary-500 via-palette-accent-600 to-palette-accent-700 bg-linear-to-br text-white"
              : "bg-gray-200 text-gray-400 dark:bg-slate-700 dark:text-slate-500"
          }`}
        >
          <Icon icon={iconName} className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3
              className={`truncate text-sm font-semibold ${
                isUnlocked ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-slate-500"
              }`}
            >
              {achievement.name}
            </h3>

            {/* Tier badge */}
            <span
              className={`inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}
            >
              {t(`tier.${achievement.tier}`)}
            </span>
          </div>

          <p
            className={`mt-0.5 text-xs ${
              isUnlocked ? "text-gray-600 dark:text-slate-400" : "text-gray-400 dark:text-slate-600"
            }`}
          >
            {achievement.description}
          </p>

          {/* Footer: XP + unlock date */}
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isUnlocked
                  ? "bg-palette-accent-500/10 text-palette-accent-600 dark:bg-palette-accent-500/20 dark:text-palette-accent-400"
                  : "bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-600"
              }`}
            >
              {achievement.xpValue} XP
            </span>

            {isUnlocked && achievement.unlockedAt && (
              <span className="text-[10px] text-gray-500 dark:text-slate-400">
                {t("unlockedOn")} {formatUnlockDate(achievement.unlockedAt, locale)}
              </span>
            )}

            {!isUnlocked && (
              <span className="text-[10px] text-gray-400 dark:text-slate-600">{t("locked")}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
