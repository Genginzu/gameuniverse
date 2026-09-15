"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { CollectionAdvancedStats } from "@/types/playerCollection";
import { CollectionStatCards } from "./CollectionStatCards";
import { CollectionGenreChart } from "./CollectionGenreChart";
import { CollectionPlatformChart } from "./CollectionPlatformChart";

interface CollectionAdvancedStatsSectionProps {
  stats: CollectionAdvancedStats | null;
  isLoading?: boolean;
}

/**
 * Advanced stats section: metric cards + genre pie + platform bar charts.
 * Shared between the collection detail view and the profile collections tab.
 */
export function CollectionAdvancedStatsSection({
  stats,
  isLoading = false,
}: CollectionAdvancedStatsSectionProps) {
  const t = useTranslations("collections.stats");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card h-20 animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="glass-card h-64 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!stats || stats.totalGames === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center rounded-xl py-8 text-center">
        <Icon icon="lucide:chart-pie" className="mb-2 h-8 w-8 text-gray-400 dark:text-slate-500" />
        <p className="text-sm text-gray-500 dark:text-slate-400">{t("empty")}</p>
      </div>
    );
  }

  const hasGenres = stats.genreDistribution.length > 0;
  const hasPlatforms = stats.platformDistribution.length > 0;

  return (
    <section className="space-y-4" aria-label={t("title")}>
      <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
        <Icon icon="lucide:chart-column" className="h-5 w-5 text-neon-primary" />
        {t("title")}
      </h2>

      <CollectionStatCards stats={stats} />

      {(hasGenres || hasPlatforms) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {hasGenres && <CollectionGenreChart distribution={stats.genreDistribution} />}
          {hasPlatforms && <CollectionPlatformChart distribution={stats.platformDistribution} />}
        </div>
      )}
    </section>
  );
}
