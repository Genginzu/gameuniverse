"use client";

import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Globe, Info, Star, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { GameDetails } from "@/types/game";
import { GameColors } from "@/lib/utils/game-utils";

interface GameOverviewSectionProps {
  game: GameDetails;
  colors: GameColors;
  formatReleaseDate: (dateString?: string) => string | null;
  getMetascoreColor: (score?: number) => string;
}

export function GameOverviewSection({
  game,
  colors,
  formatReleaseDate,
  getMetascoreColor,
}: GameOverviewSectionProps) {
  const t = useTranslations();
  const tDetails = useTranslations("gameDetails");

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-white">{tDetails("overview")}</h2>
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Developers */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" style={{ color: colors.accent }} />
            <div className="text-sm text-slate-400">{t("game.developer")}</div>
          </div>
          <div className="space-y-1">
            {game.companies?.developers?.length > 0 ? (
              game.companies.developers.map((dev) => (
                <div key={dev.id} className="font-medium text-white">
                  {dev.name}
                </div>
              ))
            ) : (
              <div className="font-medium text-white">{game.developer}</div>
            )}
          </div>
        </div>

        {/* Publishers */}
        {(game.companies?.publishers?.length > 0
          ? game.companies.publishers.some(
              (pub) => !game.companies.developers?.some((dev) => dev.id === pub.id)
            )
          : game.publisher !== game.developer) && (
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Globe className="h-4 w-4" style={{ color: colors.accent }} />
              <div className="text-sm text-slate-400">{t("game.publisher")}</div>
            </div>
            <div className="space-y-1">
              {game.companies?.publishers?.length > 0 ? (
                game.companies.publishers
                  .filter((pub) => !game.companies.developers?.some((dev) => dev.id === pub.id))
                  .map((pub) => (
                    <div key={pub.id} className="font-medium text-white">
                      {pub.name}
                    </div>
                  ))
              ) : (
                <div className="font-medium text-white">{game.publisher}</div>
              )}
            </div>
          </div>
        )}

        {/* Release date */}
        {game.releaseDate && (
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" style={{ color: colors.accent }} />
              <div className="text-sm text-slate-400">{t("game.releaseDate")}</div>
            </div>
            <div className="font-medium text-white">{formatReleaseDate(game.releaseDate)}</div>
          </div>
        )}

        {/* Metascore */}
        {game.metascore && (
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Star className="h-4 w-4" style={{ color: colors.accent }} />
              <div className="text-sm text-slate-400">Metascore</div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`${getMetascoreColor(game.metascore)} rounded-lg px-3 py-1 text-lg font-bold text-white`}
              >
                {game.metascore}
              </div>
              <div className="text-sm text-slate-300">
                {game.metascore >= 90
                  ? tDetails("metascoreRatings.exceptional")
                  : game.metascore >= 75
                    ? tDetails("metascoreRatings.excellent")
                    : game.metascore >= 60
                      ? tDetails("metascoreRatings.good")
                      : game.metascore >= 40
                        ? tDetails("metascoreRatings.average")
                        : tDetails("metascoreRatings.poor")}
              </div>
            </div>
          </div>
        )}

        {/* Platforms */}
        {game.pricing.length > 0 && (
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Smartphone className="h-4 w-4" style={{ color: colors.accent }} />
              <div className="text-sm text-slate-400">{tDetails("platforms")}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(game.pricing.map((p) => p.platform))).map((platform) => (
                <Badge
                  key={platform}
                  variant="secondary"
                  className="border-slate-600 bg-slate-700 text-slate-200"
                >
                  {platform}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Genres */}
        {game.genres.length > 0 && (
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" style={{ color: colors.accent }} />
              <div className="text-sm text-slate-400">{t("game.genres")}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {game.genres.map((genre) => (
                <Badge
                  key={genre.id}
                  variant="outline"
                  className="pointer-events-none border-slate-600 text-slate-300"
                >
                  {genre.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
