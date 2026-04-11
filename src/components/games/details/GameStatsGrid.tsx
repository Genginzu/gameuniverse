"use client";

import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { GameDetails } from "@/types/game";
import { GameColors } from "@/lib/utils/game-utils";

interface GameStatsGridProps {
  game: GameDetails;
  colors: GameColors;
  getMetascoreColor: (score?: number) => string;
  formatPrice: (price: number, currency: string) => string;
}

/**
 * Bento-style stats grid matching the mockup layout:
 * 4 compact cards in a row showing key game metrics.
 */
export function GameStatsGrid({
  game,
  colors,
  getMetascoreColor,
  formatPrice,
}: GameStatsGridProps) {
  const tDetails = useTranslations("gameDetails");
  const labelStyle = { color: colors.labelColor };

  // Determine age rating display
  const ageRating = game.ageRating || game.ageRatings?.[0];
  const ageDisplay = ageRating?.minimumAge ? `${ageRating.minimumAge}+` : ageRating?.rating || null;

  // Cheapest price across all stores
  const cheapest =
    game.pricing.length > 0
      ? game.pricing.reduce((min, p) => (p.price < min.price ? p : min), game.pricing[0])
      : null;

  // Metascore colored badge class
  const stats = [
    {
      icon: "lucide:star",
      value: game.metascore && game.metascore > 0 ? String(game.metascore) : "—",
      label: tDetails("statsGrid.globalScore"),
      metascoreBg:
        game.metascore && game.metascore > 0 ? getMetascoreColor(game.metascore) : undefined,
      show: true,
    },
    {
      icon: "lucide:tag",
      value: cheapest ? formatPrice(cheapest.price, cheapest.currency) : "—",
      label: tDetails("statsGrid.price"),
      metascoreBg: undefined,
      show: true,
    },
    {
      icon: "lucide:gamepad-2",
      value: "",
      label: tDetails("statsGrid.genres"),
      metascoreBg: undefined,
      show: game.genres.length > 0,
      genres: game.genres,
    },
    {
      icon: "lucide:shield",
      value: ageDisplay || "—",
      label: tDetails("statsGrid.classification"),
      metascoreBg: undefined,
      show: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats
        .filter((s) => s.show)
        .map((stat, index) => {
          const StatIcon = stat.icon;
          return (
            <div
              key={index}
              className={`flex flex-col justify-between rounded-xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/10 backdrop-blur-xl will-change-transform`}
            >
              <div className="mb-2">
                <Icon icon={StatIcon} className="h-4 w-4" style={{ color: colors.accent }} />
              </div>
              {stat.metascoreBg ? (
                <div
                  className={`${stat.metascoreBg} mb-1 inline-block rounded-lg px-2.5 py-0.5 text-xl font-bold text-white`}
                >
                  {stat.value}
                </div>
              ) : stat.genres ? (
                <div className="mb-1 flex flex-wrap gap-1">
                  {stat.genres.map((genre) => (
                    <Badge
                      key={genre.id}
                      variant="outline"
                      className="pointer-events-none rounded-md border-white/10 text-[10px]"
                      style={labelStyle}
                    >
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-xl font-bold" style={{ color: colors.textColor }}>
                  {stat.value}
                </div>
              )}
              {!stat.genres && (
                <div className="text-xs" style={labelStyle}>
                  {stat.label}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
