"use client";

import dynamic from "next/dynamic";
import { GameMediaGallery } from "./GameMediaGallery";
import { GameStatsGrid } from "./GameStatsGrid";
import { GamePricingSection } from "./GamePricingSection";
import { GameDetails } from "@/types/game";
import { GameColors } from "@/lib/utils/game-utils";
import { TabType } from "./GameDetailsTabs";
import {
  AgeRatingsSkeleton,
  VersionsSkeleton,
  DlcExtensionsSkeleton,
  ReviewsSkeleton,
  PlaytimeSkeleton,
  LanguagesSkeleton,
  MusicSkeleton,
  PriceHistorySkeleton,
} from "./TabSkeletons";

// Lazy load des onglets non-overview pour réduire le bundle initial.
// Chaque dynamic() a un skeleton spécifique qui reproduit le layout réel.
const GameAgeRatings = dynamic(() => import("./GameAgeRatings").then((m) => m.GameAgeRatings), {
  loading: () => <AgeRatingsSkeleton />,
});
const GameVersions = dynamic(() => import("./GameVersions").then((m) => m.GameVersions), {
  loading: () => <VersionsSkeleton />,
});
const GameDlcExtensions = dynamic(
  () => import("./GameDlcExtensions").then((m) => m.GameDlcExtensions),
  { loading: () => <DlcExtensionsSkeleton /> }
);
const GameReviewsTab = dynamic(
  () => import("../reviews/GameReviewsTab").then((m) => m.GameReviewsTab),
  { loading: () => <ReviewsSkeleton /> }
);
const GamePlaytime = dynamic(() => import("./GamePlaytime").then((m) => m.GamePlaytime), {
  loading: () => <PlaytimeSkeleton />,
});
const GameDetailsTabLanguages = dynamic(
  () => import("./GameDetailsTabLanguages").then((m) => m.GameDetailsTabLanguages),
  { loading: () => <LanguagesSkeleton /> }
);
const GameDetailsTabMusic = dynamic(
  () => import("./GameDetailsTabMusic").then((m) => m.GameDetailsTabMusic),
  { loading: () => <MusicSkeleton /> }
);
const PriceHistoryTab = dynamic(() => import("./PriceHistoryTab").then((m) => m.PriceHistoryTab), {
  loading: () => <PriceHistorySkeleton />,
});

interface GameDetailsTabContentProps {
  game: GameDetails;
  colors: GameColors;
  activeTab: TabType;
  getMetascoreColor: (score?: number) => string;
  formatPrice: (price: number, currency: string) => string;
}

/** Renders the content panel for the currently active tab. */
export function GameDetailsTabContent({
  game,
  colors,
  activeTab,
  getMetascoreColor,
  formatPrice,
}: GameDetailsTabContentProps) {
  return (
    <div className="space-y-8">
      {activeTab === "overview" && (
        <GameDetailsTabOverview
          game={game}
          colors={colors}
          getMetascoreColor={getMetascoreColor}
          formatPrice={formatPrice}
        />
      )}

      {activeTab === "ageRatings" && (
        <GameAgeRatings ratings={game.ageRatings} accentColor={colors.accent} />
      )}

      {activeTab === "versions" && (
        <GameVersions versions={game.versions} accentColor={colors.accent} />
      )}

      {activeTab === "dlcExtensions" && (
        <GameDlcExtensions dlcExtensions={game.dlcExtensions ?? []} accentColor={colors.accent} />
      )}

      {activeTab === "reviews" && (
        <GameReviewsTab gameId={game.id} gameTitle={game.title} accentColor={colors.primary} />
      )}

      {activeTab === "playtime" && (
        <GamePlaytime playtime={game.playtime} accentColor={colors.accent} slug={game.slug} />
      )}

      {activeTab === "languages" && (
        <GameDetailsTabLanguages languages={game.languages} colors={colors} />
      )}

      {activeTab === "music" && <GameDetailsTabMusic music={game.music} colors={colors} />}

      {activeTab === "priceHistory" && (
        <PriceHistoryTab
          gameSlug={game.slug}
          currentPrice={game.pricing?.[0]?.price}
          colors={{ primary: colors.primary, secondary: colors.secondary }}
        />
      )}
    </div>
  );
}

/** Overview tab: description, stats grid, pricing, media gallery. */
function GameDetailsTabOverview({
  game,
  colors,
  getMetascoreColor,
  formatPrice,
}: {
  game: GameDetails;
  colors: GameColors;
  getMetascoreColor: (score?: number) => string;
  formatPrice: (price: number, currency: string) => string;
}) {
  return (
    <>
      {game.description && (
        <p className="max-w-3xl text-base leading-relaxed text-white">{game.description}</p>
      )}
      <GameStatsGrid
        game={game}
        colors={colors}
        getMetascoreColor={getMetascoreColor}
        formatPrice={formatPrice}
      />
      <GamePricingSection pricing={game.pricing} colors={colors} formatPrice={formatPrice} />
      <GameMediaGallery media={game.media} gameTitle={game.title} />
    </>
  );
}
