"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Lock, AlertCircle } from "lucide-react";
import type { EnrichedStats } from "@/types/player-stats";
import { EnrichedStatCards } from "./EnrichedStatCards";

interface PlayerEnrichedStatsProps {
  playerId: string;
  locale: string;
  isOwnProfile: boolean;
  statsPrivate: boolean;
  totalGames: number;
}

type FetchState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "private" }
  | { status: "success"; data: EnrichedStats };

const CARD_STYLE =
  "rounded-2xl border-gray-200 bg-white backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/50";

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
  const [state, setState] = useState<FetchState>(
    // Skip fetch when we already know stats are private for a visitor
    !isOwnProfile && statsPrivate ? { status: "private" } : { status: "loading" }
  );

  const fetchStats = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/players/${playerId}/stats?locale=${locale}`);
      if (!res.ok) {
        setState({ status: "error" });
        return;
      }
      const json = await res.json();
      if (json.private) {
        setState({ status: "private" });
        return;
      }
      setState({ status: "success", data: json.stats });
    } catch {
      setState({ status: "error" });
    }
  }, [playerId, locale]);

  useEffect(() => {
    if (!isOwnProfile && statsPrivate) return;
    fetchStats();
  }, [fetchStats, isOwnProfile, statsPrivate]);

  const title = (
    <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
      {t("enrichedStats.title")}
    </h2>
  );

  // Private stats — visitor cannot see (Req 8.2)
  if (state.status === "private") {
    return (
      <div className="mb-8">
        {title}
        <Card className={CARD_STYLE}>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <Lock className="h-8 w-8 text-gray-400 dark:text-slate-400" />
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
  if (state.status === "loading") {
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
  if (state.status === "error") {
    return (
      <div className="mb-8">
        {title}
        <Card className={CARD_STYLE}>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-gray-500 dark:text-slate-400">{t("enrichedStats.error")}</p>
            <Button variant="outline" size="sm" onClick={fetchStats}>
              {t("enrichedStats.retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {title}
      <EnrichedStatCards stats={state.data} locale={locale} t={t} totalGames={totalGames} />
    </div>
  );
}
