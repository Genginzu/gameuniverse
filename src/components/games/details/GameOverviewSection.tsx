"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { GameDetails } from "@/types/game";
import { GameColors } from "@/lib/utils/game-utils";
import { getPlatformIcon } from "@/lib/utils/platform-icons";
import { Icon } from "@iconify/react";
import { OverviewInfoCard } from "./OverviewInfoCard";

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
  const textStyle = { color: colors.textColor };

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold" style={textStyle}>
        {tDetails("overview")}
      </h2>
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-4">
        <OverviewInfoCard
          icon="lucide:users"
          label={t("game.developer")}
          accentColor={colors.accent}
          labelColor={colors.labelColor}
        >
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
        </OverviewInfoCard>

        {(game.companies?.publishers?.length > 0 ? true : game.publisher !== game.developer) && (
          <OverviewInfoCard
            icon="lucide:globe"
            label={t("game.publisher")}
            accentColor={colors.accent}
            labelColor={colors.labelColor}
          >
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
          </OverviewInfoCard>
        )}

        {game.releaseDate && (
          <OverviewInfoCard
            icon="lucide:calendar"
            label={t("game.releaseDate")}
            accentColor={colors.accent}
            labelColor={colors.labelColor}
          >
            <div className="font-medium" style={textStyle}>
              {formatReleaseDate(game.releaseDate)}
            </div>
          </OverviewInfoCard>
        )}

        {game.metascore && game.metascore > 0 && (
          <OverviewInfoCard
            icon="lucide:star"
            label="Metascore"
            accentColor={colors.accent}
            labelColor={colors.labelColor}
          >
            <div className="flex items-center gap-2">
              <div
                className={`${getMetascoreColor(game.metascore)} rounded-lg px-3 py-1 text-lg font-bold text-white`}
              >
                {game.metascore}
              </div>
              <div className="text-sm" style={{ color: colors.labelColor }}>
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
          </OverviewInfoCard>
        )}

        {game.pricing.length > 0 && (
          <OverviewInfoCard
            icon="lucide:smartphone"
            label={tDetails("platforms")}
            accentColor={colors.accent}
            labelColor={colors.labelColor}
          >
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(game.pricing.map((p) => p.platform))).map((platform) => (
                <Badge
                  key={platform}
                  variant="secondary"
                  className="inline-flex items-center gap-1.5 border-slate-600 bg-slate-700"
                  style={textStyle}
                >
                  <Icon icon={getPlatformIcon(platform)} className="h-3.5 w-3.5 shrink-0" />
                  {platform}
                </Badge>
              ))}
            </div>
          </OverviewInfoCard>
        )}

        {game.genres.length > 0 && (
          <OverviewInfoCard
            icon="lucide:info"
            label={t("game.genres")}
            accentColor={colors.accent}
            labelColor={colors.labelColor}
          >
            <div className="flex flex-wrap gap-2">
              {game.genres.map((genre) => (
                <Badge
                  key={genre.id}
                  variant="outline"
                  className="pointer-events-none border-slate-600"
                  style={{ color: colors.labelColor }}
                >
                  {genre.name}
                </Badge>
              ))}
            </div>
          </OverviewInfoCard>
        )}
      </div>
    </div>
  );
}
