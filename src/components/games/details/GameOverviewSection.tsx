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

  const labelStyle = { color: colors.labelColor };
  const textStyle = { color: colors.textColor };

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold" style={textStyle}>
        {tDetails("overview")}
      </h2>
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Developers */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" style={{ color: colors.accent }} />
            <div className="text-sm" style={labelStyle}>
              {t("game.developer")}
            </div>
          </div>
          <div className="space-y-1">
            {game.companies?.developers?.length > 0 ? (
              game.companies.developers.map((dev) => (
                <div key={dev.id} className="font-medium" style={textStyle}>
                  {dev.name}
                </div>
              ))
            ) : (
              <div className="font-medium" style={textStyle}>
                {game.developer}
              </div>
            )}
          </div>
        </div>

        {/* Publishers */}
        {(game.companies?.publishers?.length > 0 ? true : game.publisher !== game.developer) && (
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Globe className="h-4 w-4" style={{ color: colors.accent }} />
              <div className="text-sm" style={labelStyle}>
                {t("game.publisher")}
              </div>
            </div>
            <div className="space-y-1">
              {game.companies?.publishers?.length > 0 ? (
                game.companies.publishers.map((pub) => (
                  <div key={pub.id} className="font-medium" style={textStyle}>
                    {pub.name}
                  </div>
                ))
              ) : (
                <div className="font-medium" style={textStyle}>
                  {game.publisher}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Release date */}
        {game.releaseDate && (
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" style={{ color: colors.accent }} />
              <div className="text-sm" style={labelStyle}>
                {t("game.releaseDate")}
              </div>
            </div>
            <div className="font-medium" style={textStyle}>
              {formatReleaseDate(game.releaseDate)}
            </div>
          </div>
        )}

        {/* Metascore */}
        {game.metascore && (
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Star className="h-4 w-4" style={{ color: colors.accent }} />
              <div className="text-sm" style={labelStyle}>
                Metascore
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`${getMetascoreColor(game.metascore)} rounded-lg px-3 py-1 text-lg font-bold text-white`}
              >
                {game.metascore}
              </div>
              <div className="text-sm" style={labelStyle}>
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
              <div className="text-sm" style={labelStyle}>
                {tDetails("platforms")}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(game.pricing.map((p) => p.platform))).map((platform) => (
                <Badge
                  key={platform}
                  variant="secondary"
                  className="border-slate-600 bg-slate-700"
                  style={textStyle}
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
              <div className="text-sm" style={labelStyle}>
                {t("game.genres")}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {game.genres.map((genre) => (
                <Badge
                  key={genre.id}
                  variant="outline"
                  className="pointer-events-none border-slate-600"
                  style={labelStyle}
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
