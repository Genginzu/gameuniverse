"use client";

import { GameDetails } from "@/types/game";
import {
  buildGameColors,
  formatReleaseDate as formatReleaseDateUtil,
  formatPrice as formatPriceUtil,
  getMetascoreColor as getMetascoreColorUtil,
} from "@/lib/utils/game-utils";
import { GameDetailsSidebar } from "./GameDetailsSidebar";
import { GameDetailsMainContent } from "./GameDetailsMainContent";
import { GameDetailsNavBar } from "./GameDetailsNavBar";
import { useBackgroundSync } from "@/hooks/useBackgroundSync";
import { useViewTracker } from "@/hooks/useViewTracker";
import Image from "next/image";

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
  useViewTracker("games", game.slug);

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
      {game.media.backgroundImage && game.media.backgroundImage !== "none" && (
        <div className="absolute inset-x-0 top-0 z-0 h-[70vh]">
          <Image
            src={game.media.backgroundImage}
            alt=""
            fill
            className="object-cover opacity-50"
            sizes="100vw"
            priority
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
      <div className="relative z-10 container mx-auto px-4 pt-20 pb-16">
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
