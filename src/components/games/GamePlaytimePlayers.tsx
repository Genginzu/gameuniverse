"use client";

import { Users, Clock, User, Zap, Gamepad2, Trophy, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import type { PlayerPlaytimeStats } from "@/types/game";

interface GamePlaytimePlayersProps {
  stats: PlayerPlaytimeStats;
  loading: boolean;
  isAuthenticated: boolean;
  accentColor: string;
  showAddButton?: boolean;
  onAddPlaytime?: () => void;
}

function formatAvg(val: number | null): string {
  if (val === null) return "-";
  return `${val.toFixed(1)}h`;
}

/**
 * Colonne droite : bouton d'ajout, moyennes joueurs,
 * séparateur, liste des contributeurs individuels.
 */
export function GamePlaytimePlayers({
  stats,
  loading,
  isAuthenticated,
  accentColor,
  showAddButton = false,
  onAddPlaytime,
}: GamePlaytimePlayersProps) {
  const t = useTranslations("gameDetails.playtime.players");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Clock className="mb-2 h-8 w-8 animate-pulse opacity-50" />
        <p className="text-sm">{t("loading")}</p>
      </div>
    );
  }

  const hasData = stats.count > 0;

  const avgCards = [
    { icon: Zap, label: t("hastily"), value: stats.averages.hastily },
    { icon: Gamepad2, label: t("normally"), value: stats.averages.normally },
    { icon: Trophy, label: t("completely"), value: stats.averages.completely },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Users className="h-5 w-5" style={{ color: accentColor }} />
          {t("title")}
        </h3>

        {showAddButton && onAddPlaytime && (
          <button
            onClick={onAddPlaytime}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            {t("addPlaytime")}
          </button>
        )}
      </div>

      {hasData ? (
        <>
          {/* Moyennes */}
          <div className="space-y-3">
            {avgCards.map(({ icon: Icon, label, value }) => (
              <Card
                key={label}
                className="rounded-xl border-slate-700 bg-slate-800/50"
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                  <p className="min-w-0 flex-1 text-sm text-slate-400">
                    {label}
                  </p>
                  <p className="text-xl font-bold text-white">
                    {formatAvg(value)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Séparateur + liste des contributeurs */}
          <hr className="border-slate-700" />

          <p className="text-sm text-slate-400">
            {t("contributorsCount", { count: stats.count })}
          </p>

          <div className="space-y-2">
            {stats.contributors.map((contributor) => (
              <div
                key={contributor.userId}
                className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/30 px-4 py-3"
              >
                {/* Avatar */}
                {contributor.avatarUrl ? (
                  <img
                    src={contributor.avatarUrl}
                    alt={contributor.username ?? ""}
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                )}

                {/* Nom */}
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
                  {contributor.username ?? t("anonymous")}
                </span>

                {/* Temps */}
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  {contributor.playtime.hastily !== null && (
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {formatAvg(contributor.playtime.hastily)}
                    </span>
                  )}
                  {contributor.playtime.normally !== null && (
                    <span className="flex items-center gap-1">
                      <Gamepad2 className="h-3 w-3" />
                      {formatAvg(contributor.playtime.normally)}
                    </span>
                  )}
                  {contributor.playtime.completely !== null && (
                    <span className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      {formatAvg(contributor.playtime.completely)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="py-6 text-center text-slate-400">
          <User className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p>{t("noData")}</p>
        </div>
      )}

      {!isAuthenticated && (
        <p className="text-center text-sm text-slate-400">{t("loginPrompt")}</p>
      )}
    </div>
  );
}
