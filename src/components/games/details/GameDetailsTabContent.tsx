"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { GameMediaGallery } from "./GameMediaGallery";
import { GameStatsGrid } from "./GameStatsGrid";
import { GamePricingSection } from "./GamePricingSection";
import { GameDetails } from "@/types/game";
import { GameColors } from "@/lib/utils/game-utils";
import { TabType } from "./GameDetailsTabs";

// Lazy load des onglets non-overview pour réduire le bundle initial.
// recharts (~50kB), TipTap (~35kB), etc. ne sont chargés qu'au clic.
const GameAgeRatings = dynamic(() => import("../GameAgeRatings").then((m) => m.GameAgeRatings));
const GameVersions = dynamic(() => import("../GameVersions").then((m) => m.GameVersions));
const GameDlcExtensions = dynamic(() =>
  import("../GameDlcExtensions").then((m) => m.GameDlcExtensions)
);
const GameReviewsTab = dynamic(
  () => import("../reviews/GameReviewsTab").then((m) => m.GameReviewsTab),
  { loading: () => <TabSkeleton lines={4} /> }
);
const GamePlaytime = dynamic(() => import("../GamePlaytime").then((m) => m.GamePlaytime), {
  loading: () => <TabSkeleton lines={3} />,
});
const GameDetailsTabLanguages = dynamic(() =>
  import("./GameDetailsTabLanguages").then((m) => m.GameDetailsTabLanguages)
);
const GameDetailsTabMusic = dynamic(() =>
  import("./GameDetailsTabMusic").then((m) => m.GameDetailsTabMusic)
);
const PriceHistoryTab = dynamic(() => import("./PriceHistoryTab").then((m) => m.PriceHistoryTab), {
  loading: () => <TabSkeleton lines={5} />,
});

/** Skeleton générique pour les onglets chargés dynamiquement */
function TabSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl bg-white/10" />
      ))}
    </div>
  );
}

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
      {/* Description */}
      {game.description && (
        <p className="max-w-3xl text-base leading-relaxed text-white">{game.description}</p>
      )}

      {/* Stats grid */}
      <GameStatsGrid
        game={game}
        colors={colors}
        getMetascoreColor={getMetascoreColor}
        formatPrice={formatPrice}
      />

      {/* Pricing / stores */}
      <GamePricingSection pricing={game.pricing} colors={colors} formatPrice={formatPrice} />

      {/* Media gallery */}
      <GameMediaGallery media={game.media} gameTitle={game.title} />
    </>
  );
}
