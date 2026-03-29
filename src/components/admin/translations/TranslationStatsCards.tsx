"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { TranslationStats, EntityType } from "@/types/admin-translations";

interface TranslationStatsCardsProps {
  stats: TranslationStats[];
  targetLang: string;
  isLoading: boolean;
}

const ENTITY_ICONS: Record<EntityType, string> = {
  games: "mdi:gamepad-variant",
  characters: "mdi:account-group",
  genres: "mdi:tag-multiple",
  companies: "mdi:domain",
  platforms: "mdi:monitor",
  character_roles: "mdi:account-star",
  genders: "mdi:gender-male-female",
  species: "mdi:paw",
  content_descriptors: "mdi:shield-alert",
  ratings: "mdi:star-circle",
};

export function TranslationStatsCards({
  stats,
  targetLang,
  isLoading,
}: TranslationStatsCardsProps) {
  const t = useTranslations("admin.translations");

  const filteredStats = stats.filter((s) => s.language === targetLang);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="glass-card animate-pulse rounded-xl p-4">
            <div className="mb-3 h-4 w-20 rounded bg-gray-200 dark:bg-slate-700" />
            <div className="h-6 w-12 rounded bg-gray-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {filteredStats.map((stat) => (
        <StatsCard key={stat.entityType} stat={stat} icon={ENTITY_ICONS[stat.entityType]} t={t} />
      ))}
    </div>
  );
}

function StatsCard({
  stat,
  icon,
  t,
}: {
  stat: TranslationStats;
  icon: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const untranslated = stat.total - stat.complete;

  return (
    <div className="glass-card rounded-xl p-4 transition-all duration-300 hover:shadow-lg">
      <div className="mb-2 flex items-center gap-2">
        <Icon icon={icon} className="size-5 text-cyan-500" />
        <h4 className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">
          {t(`entityTypes.${stat.entityType}`)}
        </h4>
      </div>

      {/* Coverage bar */}
      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200/60 dark:bg-slate-700/60">
        <div
          className="h-full rounded-full bg-linear-to-r from-cyan-500 to-violet-500 transition-all duration-500"
          style={{ width: `${stat.percentage}%` }}
        />
      </div>

      <div className="flex items-end justify-between">
        <span className="text-lg font-bold text-gray-900 dark:text-white">{stat.percentage}%</span>
        <span className="text-[10px] text-gray-500 dark:text-gray-400">
          {stat.complete}/{stat.total}
        </span>
      </div>

      <div className="mt-1 flex gap-3 text-[10px]">
        <span className="text-emerald-600 dark:text-emerald-400">
          {t("stats.translated")}: {stat.complete}
        </span>
        <span className="text-amber-600 dark:text-amber-400">
          {t("stats.untranslated")}: {untranslated}
        </span>
      </div>
    </div>
  );
}
