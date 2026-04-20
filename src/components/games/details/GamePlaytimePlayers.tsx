"use client";

import { Icon } from "@iconify/react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import type { PlayerPlaytimeStats } from "@/types/game";
import { getContrastTextColor } from "@/lib/utils/game-utils";

interface GamePlaytimePlayersProps {
  stats: PlayerPlaytimeStats;
  loading: boolean;
  accentColor: string;
  showAddButton?: boolean;
  onAddPlaytime?: () => void;
}

function formatAvg(val: number | null): string {
  if (val === null) return "-";
  return `${val.toFixed(1)}h`;
}

/**
 * Colonne droite : titre avec count, bouton d'ajout, moyennes joueurs.
 * Style identique aux cartes IGDB (icône dans carré coloré).
 */
export function GamePlaytimePlayers({
  stats,
  loading,
  accentColor,
  showAddButton = false,
  onAddPlaytime,
}: GamePlaytimePlayersProps) {
  const t = useTranslations("gameDetails.playtime.players");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400">
        <LoadingSpinner size="sm" />
        <p className="text-sm">{t("loading")}</p>
      </div>
    );
  }

  const hasData = stats.count > 0;

  const avgCards = [
    { icon: "lucide:zap", label: t("hastily"), value: stats.averages.hastily },
    { icon: "lucide:gamepad-2", label: t("normally"), value: stats.averages.normally },
    { icon: "lucide:trophy", label: t("completely"), value: stats.averages.completely },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Icon icon="lucide:users" className="h-5 w-5" style={{ color: accentColor }} />
          {t("title")}
          {hasData && (
            <span className="text-sm font-normal text-slate-400">
              ({stats.count} {stats.count === 1 ? t("playerSingular") : t("playerPlural")})
            </span>
          )}
        </h3>

        {showAddButton && onAddPlaytime && (
          <button
            onClick={onAddPlaytime}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-90"
            style={{
              backgroundColor: accentColor,
              color: getContrastTextColor(accentColor),
            }}
          >
            <Icon icon="lucide:plus" className="h-4 w-4" />
            {t("addPlaytime")}
          </button>
        )}
      </div>

      {hasData ? (
        <div className="space-y-3">
          {avgCards.map(({ icon: iconName, label, value }) => (
            <Card
              key={label}
              className="rounded-xl border-white/10 bg-white/5 shadow-lg shadow-black/20 backdrop-blur-xl"
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  <Icon icon={iconName} className="h-5 w-5" style={{ color: accentColor }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-400">{label}</p>
                </div>
                <p className="text-xl font-bold text-white">{formatAvg(value)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-slate-400">
          <Icon icon="lucide:users" className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p>{t("noData")}</p>
        </div>
      )}
    </div>
  );
}
