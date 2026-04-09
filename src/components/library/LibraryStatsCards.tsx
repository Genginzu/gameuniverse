"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@iconify/react";

interface LibraryStats {
  totalGames: number;
  completedGames: number;
  totalPlayTime: number;
  averageRating?: number;
}

interface StatCardProps {
  icon: string;
  iconColorClass: string;
  bgColorClass: string;
  title: string;
  value: string | number;
  subtitle: string;
}

function StatCard({ icon, iconColorClass, bgColorClass, title, value, subtitle }: StatCardProps) {
  return (
    <Card className="rounded-2xl bg-white dark:bg-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center">
          <div className={`rounded-lg p-2 ${bgColorClass}`}>
            <Icon icon={icon} className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColorClass}`} />
          </div>
          <div className="ml-3">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
              {title}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">{value}</div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

interface LibraryStatsCardsProps {
  stats: LibraryStats;
}

export function LibraryStatsCards({ stats }: LibraryStatsCardsProps) {
  const t = useTranslations("userLibrary");

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 sm:mb-8 sm:gap-6 md:grid-cols-4">
      <StatCard
        icon="fa:gamepad"
        iconColorClass="text-blue-600 dark:text-blue-400"
        bgColorClass="bg-blue-100 dark:bg-blue-900/30"
        title={t("stats.gamesOwned")}
        value={stats.totalGames}
        subtitle={t("stats.inLibrary")}
      />
      <StatCard
        icon="fa:gamepad"
        iconColorClass="text-green-600 dark:text-green-400"
        bgColorClass="bg-green-100 dark:bg-green-900/30"
        title={t("stats.gamesCompleted")}
        value={stats.completedGames}
        subtitle={t("stats.completedPercent")}
      />
      <StatCard
        icon="fa:clock"
        iconColorClass="text-purple-600 dark:text-purple-400"
        bgColorClass="bg-purple-100 dark:bg-purple-900/30"
        title={t("stats.playTime")}
        value={`${stats.totalPlayTime}h`}
        subtitle={t("stats.totalPlayed")}
      />
      <StatCard
        icon="fa:star"
        iconColorClass="text-yellow-600 dark:text-yellow-400"
        bgColorClass="bg-yellow-100 dark:bg-yellow-900/30"
        title={t("stats.averageRating")}
        value={stats.averageRating ? `${stats.averageRating}/5` : "—"}
        subtitle={t("stats.yourRatings")}
      />
    </div>
  );
}
