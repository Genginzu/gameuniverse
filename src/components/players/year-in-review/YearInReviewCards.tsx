"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LazyImage } from "@/components/ui/lazy-image";
import { Icon } from "@iconify/react";
import { formatPlayTime } from "@/lib/utils/formatPlayTime";
import type { YearInReview } from "@/types/player-stats";

interface YearInReviewCardsProps {
  yearReview: YearInReview;
  locale: string;
  t: (key: string, values?: Record<string, string | number>) => string;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}

function StatCard({ icon, label, children }: StatCardProps) {
  return (
    <Card className="rounded-2xl border-slate-700/50 bg-slate-800/50 backdrop-blur-xs">
      <CardContent className="p-6">
        <div className="mb-2 flex items-center gap-2 text-slate-400">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export function YearInReviewCards({ yearReview, locale, t }: YearInReviewCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Total Play Time — Req 6.2 */}
      <StatCard
        icon={<Icon icon="lucide:clock" className="h-5 w-5 text-purple-400" />}
        label={t("totalPlayTime")}
      >
        <p className="text-2xl font-bold text-white">
          {formatPlayTime(yearReview.totalPlayTime, locale)}
          <span className="ml-1 text-base font-normal text-slate-400">h</span>
        </p>
      </StatCard>

      {/* Games Added — Req 6.2 */}
      <StatCard
        icon={<Icon icon="lucide:gamepad-2" className="h-5 w-5 text-blue-400" />}
        label={t("gamesAdded")}
      >
        <p className="text-2xl font-bold text-white">{yearReview.gamesAdded}</p>
      </StatCard>

      {/* Favorite Genre — Req 6.2 */}
      <StatCard
        icon={<Icon icon="lucide:tag" className="h-5 w-5 text-green-400" />}
        label={t("favoriteGenre")}
      >
        {yearReview.favoriteGenre ? (
          <p className="text-2xl font-bold text-white">{yearReview.favoriteGenre.name}</p>
        ) : (
          <p className="text-lg text-slate-500">{t("noFavoriteGenre")}</p>
        )}
      </StatCard>

      {/* Top Game — Req 6.2 */}
      <StatCard
        icon={<Icon icon="lucide:trophy" className="h-5 w-5 text-amber-400" />}
        label={t("topGame")}
      >
        {yearReview.topGame ? (
          <div className="flex items-center gap-3">
            {yearReview.topGame.coverImage && (
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md">
                <LazyImage
                  src={yearReview.topGame.coverImage}
                  alt={yearReview.topGame.title}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-white">{yearReview.topGame.title}</p>
              <p className="text-sm text-slate-400">
                {formatPlayTime(yearReview.topGame.playTime, locale)} h
              </p>
            </div>
          </div>
        ) : (
          <p className="text-lg text-slate-500">{t("noTopGame")}</p>
        )}
      </StatCard>

      {/* Reviews Written — Req 6.2 */}
      <StatCard
        icon={<Icon icon="lucide:star" className="h-5 w-5 text-yellow-400" />}
        label={t("reviewCount")}
      >
        <p className="text-2xl font-bold text-white">{yearReview.reviewCount}</p>
      </StatCard>

      {/* Most Active Month — Req 6.2, 5.5 */}
      <StatCard
        icon={<Icon icon="lucide:calendar" className="h-5 w-5 text-rose-400" />}
        label={t("mostActiveMonth")}
      >
        {yearReview.mostActiveMonth ? (
          <div>
            <p className="text-2xl font-bold text-white">
              {t(`months.${yearReview.mostActiveMonth.month}`)}
            </p>
            <p className="text-sm text-slate-400">
              {t("gamesAddedCount", { count: yearReview.mostActiveMonth.gamesAdded })}
            </p>
          </div>
        ) : (
          <p className="text-lg text-slate-500">{t("noActiveMonth")}</p>
        )}
      </StatCard>
    </div>
  );
}
