"use client";

import { useTranslations } from "next-intl";
import useSWR from "swr";
import { Icon } from "@iconify/react";
import { Card, CardContent } from "@/components/ui/card";
import { StatsDashboardSkeleton } from "@/components/players/stats/StatsDashboardSkeleton";
import { Button } from "@/components/ui/button";
import type { DashboardStatsResponse } from "@/types/dashboard-stats";
import { StatsSectionTitle } from "@/components/players/stats/StatsSectionTitle";
import { StatsOverviewCards } from "@/components/players/stats/StatsOverviewCards";
import dynamic from "next/dynamic";
import { CompletionTracker } from "@/components/players/stats/CompletionTracker";
import { SocialStats } from "@/components/players/stats/SocialStats";
import { PlaytimeStats } from "@/components/players/stats/PlaytimeStats";

// Lazy-load recharts-heavy components to reduce initial bundle (~45 kB gzipped)
const GenreDistributionChart = dynamic(
  () =>
    import("@/components/players/stats/GenreDistributionChart").then(
      (m) => m.GenreDistributionChart
    ),
  { ssr: false }
);
const PlatformDistributionChart = dynamic(
  () =>
    import("@/components/players/stats/PlatformDistributionChart").then(
      (m) => m.PlatformDistributionChart
    ),
  { ssr: false }
);
const ReviewAnalytics = dynamic(
  () => import("@/components/players/stats/ReviewAnalytics").then((m) => m.ReviewAnalytics),
  { ssr: false }
);
const ActivityTimeline = dynamic(
  () => import("@/components/players/stats/ActivityTimeline").then((m) => m.ActivityTimeline),
  { ssr: false }
);
const SessionStats = dynamic(
  () => import("@/components/players/stats/SessionStats").then((m) => m.SessionStats),
  { ssr: false }
);

interface StatsDashboardProps {
  playerId: string;
  locale: string;
  isOwnProfile: boolean;
  statsPrivate: boolean;
}

/** Custom fetcher that detects private stats and throws typed errors */
async function dashboardFetcher(url: string): Promise<DashboardStatsResponse> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("fetch_error");
  const json = await res.json();
  if (json.private === true) throw new Error("private");
  return json;
}

const CARD_STYLE =
  "rounded-2xl border-gray-200 bg-white backdrop-blur-xs dark:border-slate-700/50 dark:bg-slate-800/50";

export function StatsDashboard({
  playerId,
  locale,
  isOwnProfile,
  statsPrivate,
}: StatsDashboardProps) {
  const t = useTranslations("playerStats");

  // Skip fetch entirely when we know stats are private for a visitor
  const isPrivate = !isOwnProfile && statsPrivate;
  const swrKey = isPrivate ? null : `/api/players/${playerId}/stats/dashboard?locale=${locale}`;

  const { data, error, isLoading, mutate } = useSWR<DashboardStatsResponse>(
    swrKey,
    dashboardFetcher,
    { revalidateOnFocus: false }
  );

  const title = <StatsSectionTitle>{t("dashboard.title")}</StatsSectionTitle>;

  // Private stats — known upfront or detected from API
  if (isPrivate || error?.message === "private") {
    return (
      <div>
        {title}
        <Card className={CARD_STYLE}>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <Icon icon="lucide:lock" className="h-8 w-8 text-gray-400 dark:text-slate-400" />
            <p className="text-lg font-medium text-gray-700 dark:text-slate-300">
              {t("dashboard.private")}
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-500">
              {t("dashboard.privateDescription")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        {title}
        <StatsDashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        {title}
        <Card className={CARD_STYLE}>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Icon icon="lucide:alert-circle" className="h-8 w-8 text-red-400" />
            <p className="text-sm text-gray-500 dark:text-slate-400">{t("dashboard.error")}</p>
            <Button variant="outline" size="sm" onClick={() => mutate()}>
              {t("dashboard.retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      {title}
      <div className="space-y-8">
        <StatsOverviewCards metrics={data.overview} locale={locale} />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <GenreDistributionChart distribution={data.genreDistribution} locale={locale} />
          <PlatformDistributionChart distribution={data.platformDistribution} locale={locale} />
        </div>
        <CompletionTracker completion={data.completion} />
        <ReviewAnalytics analytics={data.reviewAnalytics} locale={locale} />
        <SocialStats social={data.social} locale={locale} />
        <ActivityTimeline timeline={data.activityTimeline} locale={locale} />
        <PlaytimeStats playtime={data.playtime} locale={locale} />
        <SessionStats sessions={data.sessions} />
      </div>
    </div>
  );
}
