"use client";

import { useTranslations, useLocale } from "next-intl";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { EntityCard, gameCardConfig } from "@/components/shared";
import { GridSkeleton } from "@/components/shared/GridSkeleton";
import { gameSkeletonConfig } from "@/components/shared/EntitySkeleton";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import type { GameSummary } from "@/types/game";

interface HomeData {
  trending: GameSummary[];
  upcoming: GameSummary[];
}

export function HomeDashboard() {
  const t = useTranslations("homeDashboard");
  const locale = useLocale();

  const { data, isLoading } = useSWR<HomeData>(
    `/api/home?locale=${locale}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  return (
    <div className="space-y-8 p-4 md:space-y-10 md:p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
      </div>

      {/* Trending section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500/20 to-violet-500/20">
              <Icon icon="lucide:flame" className="size-5 text-cyan-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 sm:text-xl dark:text-white">{t("trending")}</h2>
          </div>
          <Link
            href="/trending"
            className="flex items-center gap-1.5 rounded-lg bg-linear-to-r from-cyan-500 to-violet-500 px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 sm:text-sm"
          >
            {t("seeAllTrending")}
            <Icon icon="lucide:arrow-right" className="size-4" />
          </Link>
        </div>
        {isLoading ? (
          <GridSkeleton count={6} columns="grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" skeletonConfig={gameSkeletonConfig} />
        ) : (
          <div className="grid grid-cols-2 gap-3 xs:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
            {data?.trending.filter(Boolean).map((game) => (
              <EntityCard key={game.id} entity={game} config={gameCardConfig} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500/20 to-violet-500/20">
              <Icon icon="lucide:calendar" className="size-5 text-cyan-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 sm:text-xl dark:text-white">{t("upcoming")}</h2>
          </div>
          <Link
            href="/upcoming"
            className="flex items-center gap-1.5 rounded-lg bg-linear-to-r from-cyan-500 to-violet-500 px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 sm:text-sm"
          >
            {t("seeAllUpcoming")}
            <Icon icon="lucide:arrow-right" className="size-4" />
          </Link>
        </div>
        {isLoading ? (
          <GridSkeleton count={6} columns="grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" skeletonConfig={gameSkeletonConfig} />
        ) : data?.upcoming.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center rounded-xl p-8 text-center">
            <Icon icon="lucide:calendar-x" className="mb-3 size-10 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("noUpcoming")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 xs:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
            {data?.upcoming.filter(Boolean).map((game) => (
              <EntityCard key={game.id} entity={game} config={gameCardConfig} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
