"use client";

import { useTranslations, useLocale } from "next-intl";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { EntityCard, gameCardConfig } from "@/components/shared";
import { GridSkeleton } from "@/components/shared/GridSkeleton";
import { gameSkeletonConfig } from "@/components/shared/EntitySkeleton";
import { Icon } from "@iconify/react";
import type { GameSummary } from "@/types/game";

interface TrendingData {
  mostViewed: GameSummary[];
  mostPopular: GameSummary[];
  bestRated: GameSummary[];
  recentlyAdded: GameSummary[];
}

interface SectionProps {
  title: string;
  icon: string;
  games: GameSummary[];
}

function TrendingSection({ title, icon, games }: SectionProps) {
  const t = useTranslations("trending");

  if (games.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500/20 to-violet-500/20">
          <Icon icon={icon} className="size-5 text-cyan-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 sm:text-xl dark:text-white">{title}</h2>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          {t("count", { count: games.length })}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 xs:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
        {games.map((game) => (
          <EntityCard key={game.id} item={game} config={gameCardConfig} />
        ))}
      </div>
    </section>
  );
}

export function TrendingContent() {
  const t = useTranslations("trending");
  const locale = useLocale();

  const { data, isLoading } = useSWR<TrendingData>(
    `/api/games/trending?locale=${locale}&limit=12`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  if (isLoading) {
    return (
      <div className="space-y-8 p-4 md:space-y-10 md:p-6 lg:p-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
            <GridSkeleton count={6} columns="grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" skeletonConfig={gameSkeletonConfig} />
          </div>
        ))}
      </div>
    );
  }

  const sections = [
    { key: "mostViewed", icon: "lucide:eye", games: data?.mostViewed ?? [] },
    { key: "mostPopular", icon: "lucide:flame", games: data?.mostPopular ?? [] },
    { key: "bestRated", icon: "lucide:star", games: data?.bestRated ?? [] },
    { key: "recentlyAdded", icon: "lucide:clock", games: data?.recentlyAdded ?? [] },
  ];

  return (
    <div className="space-y-8 p-4 md:space-y-10 md:p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
      </div>

      {sections.map((section) => (
        <TrendingSection
          key={section.key}
          title={t(`sections.${section.key}`)}
          icon={section.icon}
          games={section.games}
        />
      ))}
    </div>
  );
}
