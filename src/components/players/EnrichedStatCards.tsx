import { Card, CardContent } from "@/components/ui/card";
import { Clock, Gamepad2, Library, Star } from "lucide-react";
import type { EnrichedStats } from "@/types/player-stats";
import { formatPlayTime } from "@/lib/utils/formatPlayTime";

function StatsCardShell({ children }: { children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardContent className="p-6">{children}</CardContent>
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
        <div className="mb-2 flex items-center gap-2 text-slate-400">
          <Library className="h-5 w-5 text-green-400" />
          <span className="text-sm font-medium">{t("enrichedStats.totalGames")}</span>
        </div>
        <p className="text-2xl font-bold text-white md:text-3xl">{totalGames}</p>
      </StatsCardShell>

      {/* Total Play Time — Req 4.1, 4.4 */}
      <StatsCardShell>
        <div className="mb-2 flex items-center gap-2 text-slate-400">
          <Clock className="h-5 w-5 text-purple-400" />
          <span className="text-sm font-medium">{t("enrichedStats.totalPlayTime")}</span>
        </div>
        <p className="text-2xl font-bold text-white md:text-3xl">
          {formatPlayTime(stats.totalPlayTime, locale)}
          <span className="ml-1 text-base font-normal text-slate-400">
            {t("enrichedStats.hours")}
          </span>
        </p>
      </StatsCardShell>

      {/* Favorite Genre — Req 4.1, 4.2 */}
      <StatsCardShell>
        <div className="mb-2 flex items-center gap-2 text-slate-400">
          <Gamepad2 className="h-5 w-5 text-blue-400" />
          <span className="text-sm font-medium">{t("enrichedStats.favoriteGenre")}</span>
        </div>
        {stats.favoriteGenre ? (
          <p className="text-2xl font-bold text-white md:text-3xl">{stats.favoriteGenre.name}</p>
        ) : (
          <p className="text-lg text-slate-500">{t("enrichedStats.noFavoriteGenre")}</p>
        )}
      </StatsCardShell>

      {/* Review Count — Req 4.1 */}
      <StatsCardShell>
        <div className="mb-2 flex items-center gap-2 text-slate-400">
          <Star className="h-5 w-5 text-yellow-400" />
          <span className="text-sm font-medium">{t("enrichedStats.reviewCount")}</span>
        </div>
        <p className="text-2xl font-bold text-white md:text-3xl">{stats.reviewCount}</p>
      </StatsCardShell>
    </div>
  );
}
