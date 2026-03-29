"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { TranslationStats, EntityType } from "@/types/admin-translations";

interface TranslationEntityGridProps {
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

export function TranslationEntityGrid({
  stats,
  targetLang,
  isLoading,
}: TranslationEntityGridProps) {
  const t = useTranslations("admin.translations");
  const filteredStats = stats.filter((s) => s.language === targetLang);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="glass-card animate-pulse rounded-xl p-5">
            <div className="mb-3 h-8 w-8 rounded-lg bg-gray-200 dark:bg-slate-700" />
            <div className="mb-2 h-4 w-24 rounded bg-gray-200 dark:bg-slate-700" />
            <div className="h-3 w-16 rounded bg-gray-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {filteredStats.map((stat) => (
        <EntityCard key={stat.entityType} stat={stat} icon={ENTITY_ICONS[stat.entityType]} t={t} />
      ))}
    </div>
  );
}

function EntityCard({
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
    <Link
      href={`/admin/translations/${stat.entityType}`}
      className="glass-card group cursor-pointer rounded-xl p-5 text-left transition-all duration-300 hover:shadow-lg hover:ring-1 hover:ring-cyan-500/30"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex size-10 items-center justify-center rounded-lg bg-linear-to-br from-cyan-500/20 to-violet-500/20">
          <Icon icon={icon} className="size-5 text-cyan-500" />
        </div>
        <Icon
          icon="mdi:chevron-right"
          className="size-5 text-gray-400 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-cyan-500"
        />
      </div>

      <h4 className="mb-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
        {t(`entityTypes.${stat.entityType}`)}
      </h4>

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
    </Link>
  );
}
