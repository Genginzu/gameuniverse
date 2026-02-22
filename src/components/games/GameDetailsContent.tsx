"use client";

import { GameDetails } from "@/types/game";
import {
  buildGameColors,
  formatReleaseDate as formatReleaseDateUtil,
  formatPrice as formatPriceUtil,
  getMetascoreColor as getMetascoreColorUtil,
} from "@/lib/utils/game-utils";
import { GameDetailsSidebar } from "./details/GameDetailsSidebar";
import { GameDetailsMainContent } from "./details/GameDetailsMainContent";
import { GameDetailsNavBar } from "./details/GameDetailsNavBar";
import { useBackgroundSync } from "@/hooks/useBackgroundSync";

interface GameDetailsProps {
  game: GameDetails;
  locale: string;
}

/**
 * GameDetailsContent - Orchestrates the game detail page layout.
 *
 * Layout: persistent 2-column with sticky sidebar (cover + actions + meta)
 * on the left, and main content (title, tabs, description, stats, media)
 * on the right.
 */
export function GameDetailsContent({ game, locale }: GameDetailsProps) {
  useBackgroundSync(game.slug, game.igdbId, game.lastSyncedAt);

  const colors = buildGameColors({
    accentColor: game.accentColor,
    backgroundColor: game.backgroundColor,
    labelColor: game.labelColor,
    textColor: game.textColor,
  });

  const formatReleaseDate = (dateString?: string) => formatReleaseDateUtil(dateString, locale);
  const formatPrice = (price: number, currency: string) => formatPriceUtil(price, currency, locale);
  const getMetascoreColor = (score?: number) => getMetascoreColorUtil(score);

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: colors.backgroundColor }}>
      {/* Background image — more visible for glassmorphism blur effect */}
      {game.media.backgroundImage && (
        <div className="absolute inset-x-0 top-0 z-0 h-[70vh]">
          <img
            src={game.media.backgroundImage}
            alt=""
            className="h-full w-full object-cover opacity-50"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, ${colors.backgroundColor}40 0%, ${colors.backgroundColor}A0 55%, ${colors.backgroundColor} 100%)`,
            }}
          />
        </div>
      )}

      <GameDetailsNavBar locale={locale} colors={colors} />

      {/* Two-column layout */}
      <div className="container relative z-10 mx-auto px-4 pb-16 pt-20">
        <div className="flex flex-col gap-8 lg:flex-row">
          <GameDetailsSidebar
            game={game}
            locale={locale}
            colors={colors}
            formatReleaseDate={formatReleaseDate}
            formatPrice={formatPrice}
          />
          <GameDetailsMainContent
            game={game}
            locale={locale}
            colors={colors}
            formatReleaseDate={formatReleaseDate}
            getMetascoreColor={getMetascoreColor}
            formatPrice={formatPrice}
          />
        </div>
      </div>
    </div>
  );
}
