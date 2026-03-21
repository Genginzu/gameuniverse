"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { AchievementCategory } from "@/types/achievement";
import { useAchievements } from "@/hooks/useAchievements";
import { filterByCategory } from "@/lib/utils/achievementGrouping";
import { AchievementsHeader } from "./AchievementsHeader";
import { AchievementCategoryFilter } from "./AchievementCategoryFilter";
import { AchievementCard } from "./AchievementCard";

interface AchievementsPageContentProps {
  playerId: string;
}

export function AchievementsPageContent({ playerId }: AchievementsPageContentProps) {
  const locale = useLocale();
  const t = useTranslations("achievements");
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | null>(null);

  const { achievements, xpStats, isLoading, error } = useAchievements(playerId, locale);

  if (isLoading) {
    return <AchievementsSkeleton />;
  }

  if (error) {
    return (
      <div className="glass-card rounded-xl p-6 text-center">
        <p className="text-sm text-red-500 dark:text-red-400">{t("error")}</p>
      </div>
    );
  }

  const filtered = filterByCategory(achievements, selectedCategory);

  return (
    <div className="space-y-6">
      <AchievementsHeader achievements={achievements} xpStats={xpStats} />

      <AchievementCategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-slate-400">{t("empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((achievement) => (
            <AchievementCard key={achievement.key} achievement={achievement} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Skeleton matching the real achievements layout: header stats + filter bar + card grid */
function AchievementsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header: title + 3 stat cards */}
      <div className="space-y-4">
        <div className="h-7 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="glass-card flex animate-pulse items-center gap-3 rounded-xl p-4"
            >
              <div className="h-10 w-10 shrink-0 rounded-xl bg-gray-200 dark:bg-slate-700" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-slate-700" />
                <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-slate-700" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category filter bar */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-slate-700"
          />
        ))}
      </div>

      {/* Achievement cards grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card animate-pulse rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-gray-200 dark:bg-slate-700" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-slate-700" />
                  <div className="h-4 w-12 rounded-full bg-gray-200 dark:bg-slate-700" />
                </div>
                <div className="h-3 w-full rounded bg-gray-200 dark:bg-slate-700" />
                <div className="flex items-center gap-2">
                  <div className="h-4 w-14 rounded-full bg-gray-200 dark:bg-slate-700" />
                  <div className="h-3 w-24 rounded bg-gray-200 dark:bg-slate-700" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
