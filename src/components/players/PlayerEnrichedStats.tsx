"use client";

import { useTranslations } from "next-intl";
import useSWR from "swr";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import type { EnrichedStats } from "@/types/player-stats";
import { EnrichedStatCards } from "./EnrichedStatCards";

interface PlayerEnrichedStatsProps {
  playerId: string;
  locale: string;
  isOwnProfile: boolean;
  statsPrivate: boolean;
  totalGames: number;
}

interface EnrichedStatsApiResponse {
  stats: EnrichedStats;
  private?: boolean;
}

/** Custom fetcher that detects private stats and throws typed errors */
async function enrichedStatsFetcher(url: string): Promise<EnrichedStats> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("fetch_error");
  const json: EnrichedStatsApiResponse = await res.json();
  if (json.private) throw new Error("private");
  return json.stats;
}

const CARD_STYLE =
  "rounded-2xl border-gray-200 bg-white backdrop-blur-xs dark:border-slate-700/50 dark:bg-slate-800/50";

/**
 * Pure function for visibility logic — exported for property-based testing.
 * Stats are visible iff the visitor is the profile owner OR stats are not private.
 */
export function shouldShowStats(isOwnProfile: boolean, statsPrivate: boolean): boolean {
  return isOwnProfile || !statsPrivate;
}

export function PlayerEnrichedStats({
  playerId,
  locale,
  isOwnProfile,
  statsPrivate,
  totalGames,
}: PlayerEnrichedStatsProps) {
  const t = useTranslations("players");

  // Skip fetch entirely when we know stats are private for a visitor
  const isPrivate = !isOwnProfile && statsPrivate;
  const swrKey = isPrivate ? null : `/api/players/${playerId}/stats?locale=${locale}`;

  const { data, error, isLoading, mutate } = useSWR<EnrichedStats>(swrKey, enrichedStatsFetcher, {
    revalidateOnFocus: false,
  });

  const title = (
    <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
      {t("enrichedStats.title")}
    </h2>
  );

  // Private stats — known upfront or detected from API (Req 8.2)
  if (isPrivate || error?.message === "private") {
    return (
      <div className="mb-8">
        {title}
        <Card className={CARD_STYLE}>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <Icon icon="lucide:lock" className="h-8 w-8 text-gray-400 dark:text-slate-400" />
            <p className="text-lg font-medium text-gray-700 dark:text-slate-300">
              {t("enrichedStats.private")}
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-500">
              {t("enrichedStats.privateDescription")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading skeleton (Req 4.3)
  if (isLoading) {
    return (
      <div className="mb-8">
        {title}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
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

  // Error state with retry
  if (error) {
    return (
      <div className="mb-8">
        {title}
        <Card className={CARD_STYLE}>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Icon icon="lucide:alert-circle" className="h-8 w-8 text-red-400" />
            <p className="text-sm text-gray-500 dark:text-slate-400">{t("enrichedStats.error")}</p>
            <Button variant="outline" size="sm" onClick={() => mutate()}>
              {t("enrichedStats.retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mb-8">
      {title}
      <EnrichedStatCards stats={data} locale={locale} t={t} totalGames={totalGames} />
    </div>
  );
}
