"use client";

import { GameDetailsTabContent } from "./GameDetailsTabContent";
import { useTranslations } from "next-intl";
import { GameDetails } from "@/types/game";
import { GameColors } from "@/lib/utils/game-utils";

export type TabType =
  | "overview"
  | "ageRatings"
  | "versions"
  | "dlcExtensions"
  | "reviews"
  | "playtime"
  | "languages"
  | "music"
  | "priceHistory";

interface GameDetailsTabsProps {
  game: GameDetails;
  colors: GameColors;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  getMetascoreColor: (score?: number) => string;
  formatPrice: (price: number, currency: string) => string;
}

/**
 * Minimalist text-only tab navigation with underline on active tab.
 * All original tabs preserved, conditionally shown.
 */
export function GameDetailsTabs({
  game,
  colors,
  activeTab,
  onTabChange,
  getMetascoreColor,
  formatPrice,
}: GameDetailsTabsProps) {
  const tDetails = useTranslations("gameDetails");

  const tabs: { key: TabType; label: string; show: boolean }[] = [
    { key: "overview", label: tDetails("tabs.overview"), show: true },
    { key: "ageRatings", label: tDetails("tabs.ageRatings"), show: true },
    { key: "versions", label: tDetails("tabs.versions"), show: !!game.versions?.length },
    {
      key: "dlcExtensions",
      label: tDetails("tabs.dlcExtensions"),
      show: !!game.dlcExtensions?.length,
    },
    { key: "reviews", label: tDetails("tabs.reviews"), show: true },
    { key: "playtime", label: tDetails("tabs.playtime"), show: true },
    { key: "languages", label: tDetails("tabs.languages"), show: true },
    { key: "music", label: tDetails("tabs.music"), show: true },
    { key: "priceHistory", label: tDetails("tabs.priceHistory"), show: true },
  ];

  return (
    <>
      {/* Tab navigation — underline style */}
      <div className="mb-8 border-b border-white/10">
        <div className="flex flex-wrap items-center gap-6">
          {tabs
            .filter((t) => t.show)
            .map((tab) => (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`relative whitespace-nowrap pb-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key ? "text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-white" />
                )}
              </button>
            ))}
        </div>
      </div>

      {/* Tab content */}
      <GameDetailsTabContent
        game={game}
        colors={colors}
        activeTab={activeTab}
        getMetascoreColor={getMetascoreColor}
        formatPrice={formatPrice}
      />
    </>
  );
}
