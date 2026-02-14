"use client";

import { User, Zap, Gamepad2, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PlayerPlaytimeContributor } from "@/types/game";

interface GamePlaytimeContributorsProps {
  contributors: PlayerPlaytimeContributor[];
}

function formatTime(val: number | null): string {
  if (val === null) return "-";
  return `${val.toFixed(1)}h`;
}

/**
 * Liste des contributeurs individuels avec leurs temps de jeu.
 * Affiché sous les deux colonnes de moyennes, après un séparateur.
 */
export function GamePlaytimeContributors({ contributors }: GamePlaytimeContributorsProps) {
  const t = useTranslations("gameDetails.playtime.players");

  if (contributors.length === 0) return null;

  return (
    <div className="space-y-2">
      {contributors.map((contributor) => (
        <div
          key={contributor.userId}
          className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/30 px-4 py-3"
        >
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

          <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
            {contributor.username ?? t("anonymous")}
          </span>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            {contributor.playtime.hastily !== null && (
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {formatTime(contributor.playtime.hastily)}
              </span>
            )}
            {contributor.playtime.normally !== null && (
              <span className="flex items-center gap-1">
                <Gamepad2 className="h-3 w-3" />
                {formatTime(contributor.playtime.normally)}
              </span>
            )}
            {contributor.playtime.completely !== null && (
              <span className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {formatTime(contributor.playtime.completely)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
