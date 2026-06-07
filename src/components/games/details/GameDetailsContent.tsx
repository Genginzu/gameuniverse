"use client";

/**
 * GameDetailsContent — orchestre la page détail jeu en mise en page
 * éditoriale magazine (inspirée du POC supprimé).
 *
 * Layout : scroll vertical, hero plein cadre + sections numérotées 01..13.
 * Pas d'onglets. L'accent dynamique est injecté par le `<DynamicAccent>`
 * parent (page.tsx) à partir de `game.accentColor`.
 *
 * Hooks fonctionnels conservés :
 *   - useBackgroundSync : refresh IGDB en arrière-plan
 *   - useViewTracker : tracking des vues
 *   - useGameLibraryStatus (dans le hero) : add/remove library
 */

import {
  formatReleaseDate as formatReleaseDateUtil,
  formatPrice as formatPriceUtil,
} from "@/lib/utils/game-utils";
import { useBackgroundSync } from "@/hooks/useBackgroundSync";
import { useViewTracker } from "@/hooks/useViewTracker";
import type { GameDetails } from "@/types/game";

import { DetailHero } from "./sections/DetailHero";
import { AboutSection } from "./sections/AboutSection";
import { StatsBento } from "./sections/StatsBento";
import { AgeRatingsSection } from "./sections/AgeRatingsSection";
import { LanguagesSection } from "./sections/LanguagesSection";
import { PlaytimeSection } from "./sections/PlaytimeSection";
import { MediaSection } from "./sections/MediaSection";
import { VersionsSection } from "./sections/VersionsSection";
import { DlcSection } from "./sections/DlcSection";
import { MusicSection } from "./sections/MusicSection";
import { PricingSection } from "./sections/PricingSection";
import { PriceHistorySection } from "./sections/PriceHistorySection";
import { ReviewsSection } from "./sections/ReviewsSection";
import { SimilarGamesSection } from "./sections/SimilarGamesSection";

interface GameDetailsContentProps {
  game: GameDetails;
  locale: string;
}

export function GameDetailsContent({ game, locale }: GameDetailsContentProps) {
  useBackgroundSync(game.slug, game.igdbId, game.lastSyncedAt);
  useViewTracker("games", game.slug);

  const formatReleaseDate = (dateString?: string) => formatReleaseDateUtil(dateString, locale);
  const formatPrice = (price: number, currency: string) => formatPriceUtil(price, currency, locale);

  return (
    <div className="editorial-game-detail">
      <DetailHero game={game} formatPrice={formatPrice} formatReleaseDate={formatReleaseDate} />
      <AboutSection game={game} />
      <StatsBento game={game} formatPrice={formatPrice} />
      <AgeRatingsSection game={game} />
      <LanguagesSection game={game} />
      <PlaytimeSection game={game} />
      <MediaSection game={game} />
      <VersionsSection game={game} />
      <DlcSection game={game} locale={locale} />
      <MusicSection game={game} />
      <PricingSection game={game} formatPrice={formatPrice} />
      <PriceHistorySection game={game} />
      <ReviewsSection game={game} />
      <SimilarGamesSection game={game} locale={locale} />
    </div>
  );
}
