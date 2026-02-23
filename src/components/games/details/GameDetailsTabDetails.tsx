"use client";

// Card/CardContent removed — not used in this tab
import { GamePlaytime } from "../GamePlaytime";
import { GameAgeRatings } from "../GameAgeRatings";
import { GameVersions } from "../GameVersions";
import { GameDlcExtensions } from "../GameDlcExtensions";
import { PriceHistoryTab } from "./PriceHistoryTab";
import { GameDetailsTabLanguages } from "./GameDetailsTabLanguages";
import { GameDetailsTabMusic } from "./GameDetailsTabMusic";
import { useTranslations } from "next-intl";
import { GameDetails } from "@/types/game";
import { GameColors } from "@/lib/utils/game-utils";

interface GameDetailsTabDetailsProps {
  game: GameDetails;
  colors: GameColors;
}

/**
 * "Détails & Temps" tab content.
 * Groups: playtime, age ratings, languages, versions, DLC, music, price history.
 */
export function GameDetailsTabDetails({ game, colors }: GameDetailsTabDetailsProps) {
  useTranslations("gameDetails");

  return (
    <div className="space-y-10">
      {/* Playtime */}
      <GamePlaytime playtime={game.playtime} accentColor={colors.accent} slug={game.slug} />

      {/* Age ratings */}
      <GameAgeRatings ratings={game.ageRatings} accentColor={colors.accent} />

      {/* Languages */}
      <GameDetailsTabLanguages languages={game.languages} colors={colors} />

      {/* Versions */}
      {game.versions && game.versions.length > 0 && (
        <GameVersions versions={game.versions} accentColor={colors.accent} />
      )}

      {/* DLC & Extensions */}
      {game.dlcExtensions && game.dlcExtensions.length > 0 && (
        <GameDlcExtensions dlcExtensions={game.dlcExtensions} accentColor={colors.accent} />
      )}

      {/* Music */}
      <GameDetailsTabMusic colors={colors} />

      {/* Price history */}
      <PriceHistoryTab
        gameSlug={game.slug}
        currentPrice={game.pricing?.[0]?.price}
        colors={{ primary: colors.primary, secondary: colors.secondary }}
      />
    </div>
  );
}
