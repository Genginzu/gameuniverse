"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Lock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { DashboardStatsResponse } from "@/types/dashboard-stats";
import { StatsSectionTitle } from "@/components/players/stats/StatsSectionTitle";
import { StatsOverviewCards } from "@/components/players/stats/StatsOverviewCards";
import { GenreDistributionChart } from "@/components/players/stats/GenreDistributionChart";
import { PlatformDistributionChart } from "@/components/players/stats/PlatformDistributionChart";
import { CompletionTracker } from "@/components/players/stats/CompletionTracker";
import { ReviewAnalytics } from "@/components/players/stats/ReviewAnalytics";
import { SocialStats } from "@/components/players/stats/SocialStats";
import { ActivityTimeline } from "@/components/players/stats/ActivityTimeline";
import { PlaytimeStats } from "@/components/players/stats/PlaytimeStats";
import { SessionStats } from "@/components/players/stats/SessionStats";
import { PersonalGoals } from "@/components/players/stats/PersonalGoals";

interface StatsDashboardProps {
  playerId: string;
  locale: string;
  isOwnProfile: boolean;
  statsPrivate: boolean;
}

type FetchState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "private" }
  | { status: "success"; data: DashboardStatsResponse };

const CARD_STYLE =
  "rounded-2xl border-gray-200 bg-white backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/50";

export function StatsDashboard({
  playerId,
  locale,
  isOwnProfile,
  statsPrivate,
}: StatsDashboardProps) {
  const t = useTranslations("playerStats");
  const [state, setState] = useState<FetchState>(
    !isOwnProfile && statsPrivate ? { status: "private" } : { status: "loading" }
  );

  const fetchStats = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/players/${playerId}/stats/dashboard?locale=${locale}`);
      if (!res.ok) {
        setState({ status: "error" });
        return;
      }
      const json = await res.json();
      if (json.private === true) {
        setState({ status: "private" });
        return;
      }
      setState({ status: "success", data: json });
    } catch {
      setState({ status: "error" });
    }
  }, [playerId, locale]);

  useEffect(() => {
    if (!isOwnProfile && statsPrivate) return;
    fetchStats();
  }, [fetchStats, isOwnProfile, statsPrivate]);

  const title = <StatsSectionTitle>{t("dashboard.title")}</StatsSectionTitle>;

  if (state.status === "private") {
    return (
      <div>
        {title}
        <Card className={CARD_STYLE}>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <Lock className="h-8 w-8 text-gray-400 dark:text-slate-400" />
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

  if (state.status === "loading") {
    return (
      <div>
        {title}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className={CARD_STYLE}>
              <CardContent className="p-6">
                <Skeleton className="mb-3 h-4 w-24 bg-gray-200 dark:bg-slate-700" />
                <Skeleton className="h-8 w-16 bg-gray-200 dark:bg-slate-700" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div>
        {title}
        <Card className={CARD_STYLE}>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-gray-500 dark:text-slate-400">{t("dashboard.error")}</p>
            <Button variant="outline" size="sm" onClick={fetchStats}>
              {t("dashboard.retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data } = state;

  return (
    <div>
      {title}
      <div className="space-y-8">
        <StatsOverviewCards metrics={data.overview} locale={locale} />
        <GenreDistributionChart distribution={data.genreDistribution} locale={locale} />
        <PlatformDistributionChart distribution={data.platformDistribution} locale={locale} />
        <CompletionTracker completion={data.completion} />
        <ReviewAnalytics analytics={data.reviewAnalytics} locale={locale} />
        <SocialStats social={data.social} locale={locale} />
        <ActivityTimeline timeline={data.activityTimeline} locale={locale} />
        <PlaytimeStats playtime={data.playtime} locale={locale} />
        <SessionStats sessions={data.sessions} />
        <PersonalGoals goals={data.goals} isOwnProfile={isOwnProfile} playerId={playerId} />
      </div>
    </div>
  );
}
