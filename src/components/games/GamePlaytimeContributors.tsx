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
    <div className="space-y-3">
      {contributors.map((contributor) => (
        <div
          key={contributor.userId}
          className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/30 px-5 py-3.5"
        >
          {/* Avatar */}
          {contributor.avatarUrl ? (
            <img
              src={contributor.avatarUrl}
              alt={contributor.username ?? ""}
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-slate-600"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 ring-2 ring-slate-600">
              <User className="h-4 w-4 text-slate-400" />
            </div>
          )}

          {/* Nom */}
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
            {contributor.username ?? t("anonymous")}
          </span>

          {/* Temps de jeu en badges, alignés à droite */}
          <div className="flex items-center gap-2">
            {contributor.playtime.hastily !== null && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700/60 px-3 py-1.5 text-sm">
                <Zap className="h-3.5 w-3.5 text-yellow-400" />
                <span className="font-bold text-white">
                  {formatTime(contributor.playtime.hastily)}
                </span>
              </span>
            )}
            {contributor.playtime.normally !== null && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700/60 px-3 py-1.5 text-sm">
                <Gamepad2 className="h-3.5 w-3.5 text-blue-400" />
                <span className="font-bold text-white">
                  {formatTime(contributor.playtime.normally)}
                </span>
              </span>
            )}
            {contributor.playtime.completely !== null && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700/60 px-3 py-1.5 text-sm">
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-bold text-white">
                  {formatTime(contributor.playtime.completely)}
                </span>
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
