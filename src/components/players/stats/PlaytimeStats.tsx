"use client";

import { useTranslations } from "next-intl";
import { Clock, Gamepad2, Trophy } from "lucide-react";
import type { PlaytimeData } from "@/types/dashboard-stats";
import { formatLocalizedNumber } from "@/lib/utils/statsFormatters";
import { StatsEmptyState } from "@/components/players/stats/StatsEmptyState";

interface PlaytimeStatsProps {
  playtime: PlaytimeData;
  locale: string;
}

export function PlaytimeStats({ playtime, locale }: PlaytimeStatsProps) {
  const t = useTranslations("playerStats");

  const isEmpty = playtime.averagePlayTimeHours === null && playtime.topGame === null;

  if (isEmpty) {
    return (
      <section>
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {t("playtime.title")}
        </h3>
        <StatsEmptyState icon={<Clock className="h-8 w-8" />} message={t("playtime.empty")} />
      </section>
    );
  }

  return (
    <section>
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        {t("playtime.title")}
      </h3>
      <div className="flex flex-col gap-4 md:flex-row">
        {/* Average play time card */}
        <div className="glass-card flex flex-1 items-center gap-4 rounded-xl p-5 transition-all duration-300">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neon-violet/20 text-neon-violet">
            <Clock className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm text-gray-500 dark:text-slate-400">
              {t("playtime.averagePlayTime")}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {playtime.averagePlayTimeHours !== null
                ? formatLocalizedNumber(playtime.averagePlayTimeHours, locale)
                : "—"}
              <span className="ml-1 text-sm font-normal text-gray-500 dark:text-slate-400">
                {t("playtime.hours")}
              </span>
            </p>
          </div>
        </div>

        {/* Top game card */}
        <div className="glass-card flex flex-1 items-center gap-4 rounded-xl p-5 transition-all duration-300">
          {playtime.topGame ? (
            <>
              <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg">
                {playtime.topGame.coverImage ? (
                  <img
                    src={playtime.topGame.coverImage}
                    alt={playtime.topGame.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-200 dark:bg-slate-700">
                    <Gamepad2 className="h-6 w-6 text-gray-400 dark:text-slate-500" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-1.5">
                  <Trophy className="h-4 w-4 shrink-0 text-neon-cyan" />
                  <p className="truncate text-sm text-gray-500 dark:text-slate-400">
                    {t("playtime.topGame")}
                  </p>
                </div>
                <p className="truncate text-base font-semibold text-gray-900 dark:text-white">
                  {playtime.topGame.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {formatLocalizedNumber(playtime.topGame.playTimeHours, locale)}{" "}
                  {t("playtime.hours")}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Gamepad2 className="h-6 w-6 text-gray-400 dark:text-slate-500" />
              <p className="text-sm text-gray-500 dark:text-slate-400">—</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
