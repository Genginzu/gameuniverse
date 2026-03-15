"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
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
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-neon-violet" />
        <span className="ml-2 text-sm text-gray-500 dark:text-slate-400">{t("loading")}</span>
      </div>
    );
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
