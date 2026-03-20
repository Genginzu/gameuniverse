"use client";

import { useTranslations, useLocale } from "next-intl";
import { Trophy, Lock, Check } from "lucide-react";
import { ACHIEVEMENT_DEFINITIONS, type AchievementData } from "@/types/dashboard-stats";
import { StatsSectionTitle } from "@/components/players/stats/StatsSectionTitle";

interface AchievementsListProps {
  achievements: AchievementData[];
  totalCount: number;
}

function formatUnlockDate(isoDate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(isoDate));
}

export function AchievementsList({ achievements, totalCount }: AchievementsListProps) {
  const t = useTranslations("playerStats");
  const locale = useLocale();

  // Build a lookup map for unlocked achievements
  const unlockedMap = new Map(
    achievements.filter((a) => a.unlockedAt !== null).map((a) => [a.key, a.unlockedAt as string])
  );

  const unlockedCount = unlockedMap.size;
  const progressPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <section>
      <StatsSectionTitle>{t("achievements.title")}</StatsSectionTitle>

      <div className="glass-card rounded-xl p-6">
        {/* Global progress bar */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-neon-violet" />
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                {t("achievements.progress", {
                  count: unlockedCount,
                  total: totalCount,
                })}
              </span>
            </div>
            <span className="text-sm font-bold text-neon-violet">{progressPercent}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-linear-to-r from-neon-violet to-neon-cyan transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Achievement badges list */}
        <div className="grid gap-3">
          {ACHIEVEMENT_DEFINITIONS.map((def) => {
            const unlockDate = unlockedMap.get(def.key);
            const isUnlocked = !!unlockDate;

            return (
              <div
                key={def.key}
                className={`flex items-center gap-3 rounded-xl p-3 transition-all duration-300 ${
                  isUnlocked
                    ? "bg-white/30 dark:bg-slate-700/40"
                    : "bg-gray-100/50 opacity-60 dark:bg-slate-800/30"
                }`}
              >
                {/* Badge icon */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    isUnlocked
                      ? "bg-linear-to-br from-neon-violet to-neon-cyan text-white"
                      : "bg-gray-200 text-gray-400 dark:bg-slate-700 dark:text-slate-500"
                  }`}
                >
                  {isUnlocked ? <Check className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                </div>

                {/* Achievement info */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm font-medium ${
                      isUnlocked
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-500 dark:text-slate-500"
                    }`}
                  >
                    {t(`achievements.names.${def.key}` as Parameters<typeof t>[0])}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    {isUnlocked
                      ? `${t("achievements.unlocked")} ${formatUnlockDate(unlockDate, locale)}`
                      : t("achievements.locked")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
