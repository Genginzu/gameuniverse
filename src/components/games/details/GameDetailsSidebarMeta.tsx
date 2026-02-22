"use client";

import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Globe, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { GameDetails } from "@/types/game";
import { GameColors } from "@/lib/utils/game-utils";

interface GameDetailsSidebarMetaProps {
  game: GameDetails;
  colors: GameColors;
  formatReleaseDate: (dateString?: string) => string | null;
}

/** Meta info card: developer, publisher, date, platforms. */
export function GameDetailsSidebarMeta({
  game,
  colors,
  formatReleaseDate,
}: GameDetailsSidebarMetaProps) {
  const t = useTranslations();
  const tDetails = useTranslations("gameDetails");
  const labelStyle = { color: colors.labelColor };
  const textStyle = { color: colors.textColor };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="space-y-4">
        {/* Developer */}
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-xs" style={labelStyle}>
            <Users className="h-3 w-3" />
            {t("game.developer")}
          </div>
          <div className="space-y-0.5">
            {game.companies?.developers?.length > 0 ? (
              game.companies.developers.map((d) => (
                <div key={d.id} className="text-sm font-medium" style={textStyle}>
                  {d.name}
                </div>
              ))
            ) : (
              <div className="text-sm font-medium" style={textStyle}>
                {game.developer}
              </div>
            )}
          </div>
        </div>

        {/* Publisher */}
        {(game.companies?.publishers?.length > 0
          ? true
          : game.publisher && game.publisher !== game.developer) && (
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-xs" style={labelStyle}>
              <Globe className="h-3 w-3" />
              {t("game.publisher")}
            </div>
            <div className="space-y-0.5">
              {game.companies?.publishers?.length > 0 ? (
                game.companies.publishers.map((p) => (
                  <div key={p.id} className="text-sm font-medium" style={textStyle}>
                    {p.name}
                  </div>
                ))
              ) : (
                <div className="text-sm font-medium" style={textStyle}>
                  {game.publisher}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Release date */}
        {game.releaseDate && (
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-xs" style={labelStyle}>
              <Calendar className="h-3 w-3" />
              {t("game.releaseDate")}
            </div>
            <div className="text-sm font-medium" style={textStyle}>
              {formatReleaseDate(game.releaseDate)}
            </div>
          </div>
        )}

        {/* Platforms */}
        {game.pricing.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs" style={labelStyle}>
              <Smartphone className="h-3 w-3" />
              {tDetails("platforms")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(new Set(game.pricing.map((p) => p.platform))).map((platform) => (
                <Badge
                  key={platform}
                  variant="secondary"
                  className="rounded-md border-white/10 bg-white/10 text-xs"
                  style={textStyle}
                >
                  {platform}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
