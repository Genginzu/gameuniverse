import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import type { EnrichedStats } from "@/types/player-stats";
import { formatPlayTime } from "@/lib/utils/formatPlayTime";

function StatsCardShell({ children }: { children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl border-gray-200 bg-white backdrop-blur-xs dark:border-slate-700/50 dark:bg-slate-800/50">
      <CardContent className="p-6 text-center">{children}</CardContent>
    </Card>
  );
}

interface EnrichedStatCardsProps {
  stats: EnrichedStats;
  locale: string;
  t: (key: string) => string;
  totalGames: number;
}

export function EnrichedStatCards({ stats, locale, t, totalGames }: EnrichedStatCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {/* Total Games in Library */}
      <StatsCardShell>
        <div className="mb-2 flex items-center justify-center gap-2 text-gray-500 dark:text-slate-400">
          <Icon icon="lucide:library" className="h-5 w-5 text-green-500 dark:text-green-400" />
          <span className="text-sm font-medium">{t("enrichedStats.totalGames")}</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">{totalGames}</p>
      </StatsCardShell>

      {/* Total Play Time — Req 4.1, 4.4 */}
      <StatsCardShell>
        <div className="mb-2 flex items-center justify-center gap-2 text-gray-500 dark:text-slate-400">
          <Icon icon="lucide:clock" className="h-5 w-5 text-purple-500 dark:text-purple-400" />
          <span className="text-sm font-medium">{t("enrichedStats.totalPlayTime")}</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
          {formatPlayTime(stats.totalPlayTime, locale)}
          <span className="ml-1 text-base font-normal text-gray-500 dark:text-slate-400">
            {t("enrichedStats.hours")}
          </span>
        </p>
      </StatsCardShell>

      {/* Favorite Genre — Req 4.1, 4.2 */}
      <StatsCardShell>
        <div className="mb-2 flex items-center justify-center gap-2 text-gray-500 dark:text-slate-400">
          <Icon icon="lucide:gamepad-2" className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          <span className="text-sm font-medium">{t("enrichedStats.favoriteGenre")}</span>
        </div>
        {stats.favoriteGenre ? (
          <p className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
            {stats.favoriteGenre.name}
          </p>
        ) : (
          <p className="text-lg text-gray-400 dark:text-slate-500">
            {t("enrichedStats.noFavoriteGenre")}
          </p>
        )}
      </StatsCardShell>

      {/* Review Count — Req 4.1 */}
      <StatsCardShell>
        <div className="mb-2 flex items-center justify-center gap-2 text-gray-500 dark:text-slate-400">
          <Icon icon="lucide:star" className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
          <span className="text-sm font-medium">{t("enrichedStats.reviewCount")}</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
          {stats.reviewCount}
        </p>
      </StatsCardShell>
    </div>
  );
}
