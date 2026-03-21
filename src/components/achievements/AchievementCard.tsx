"use client";

import { useLocale, useTranslations } from "next-intl";
import type { PlayerAchievementWithDetails } from "@/types/achievement";
import { Icon } from "@iconify/react";

const ICON_MAP: Record<string, string> = {
  BookOpen: "lucide:book-open",
  Library: "lucide:library",
  BookMarked: "lucide:book-marked",
  Clock: "lucide:clock",
  Timer: "lucide:timer",
  Hourglass: "lucide:hourglass",
  Star: "lucide:star",
  MessageSquare: "lucide:message-square",
  PenLine: "lucide:pen-line",
  UserPlus: "lucide:user-plus",
  Users: "lucide:users",
  FolderPlus: "lucide:folder-plus",
  Layers: "lucide:layers",
  Grid3X3: "lucide:grid-3x3",
};

const TIER_STYLES = {
  bronze: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-300 dark:border-amber-700",
  },
  silver: {
    bg: "bg-slate-100 dark:bg-slate-700/40",
    text: "text-slate-600 dark:text-slate-300",
    border: "border-slate-300 dark:border-slate-600",
  },
  gold: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
    border: "border-yellow-300 dark:border-yellow-700",
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
  const iconName = ICON_MAP[achievement.icon] ?? "lucide:trophy";
  const tierStyle = TIER_STYLES[achievement.tier];

  return (
    <div
      className={`glass-card rounded-xl p-4 transition-all duration-300 ${
        isUnlocked ? "" : "opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isUnlocked
              ? "bg-linear-to-br from-blue-500 via-purple-600 to-purple-700 text-white"
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
                  ? "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400"
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
