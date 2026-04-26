"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const updateScrollState = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    };

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -160 : 160,
      behavior: "smooth",
    });
  };

  const tabs: { key: TabType; label: string; show: boolean }[] = [
    { key: "overview", label: tDetails("tabs.overview"), show: true },
    { key: "reviews", label: tDetails("tabs.reviews"), show: true },
    { key: "playtime", label: tDetails("tabs.playtime"), show: true },
    { key: "ageRatings", label: tDetails("tabs.ageRatings"), show: true },
    { key: "languages", label: tDetails("tabs.languages"), show: true },
    { key: "music", label: tDetails("tabs.music"), show: true },
    { key: "priceHistory", label: tDetails("tabs.priceHistory"), show: true },
    { key: "versions", label: tDetails("tabs.versions"), show: !!game.versions?.length },
    { key: "dlcExtensions", label: tDetails("tabs.dlcExtensions"), show: !!game.dlcExtensions?.length },
  ];

  return (
    <>
      {/* Tab navigation — underline style */}
      <div className="relative mb-8 border-b border-white/10">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label={tDetails("tabs.scrollLeft")}
            className="absolute top-0 bottom-0 left-0 z-10 flex items-center bg-gradient-to-r from-black/60 to-transparent pr-6 text-white/80 hover:text-white"
          >
            <Icon icon="lucide:chevron-left" className="h-5 w-5" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="scrollbar-hide -mb-px flex items-center gap-6 overflow-x-auto"
        >
          {tabs
            .filter((t) => t.show)
            .map((tab) => (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`relative shrink-0 pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key ? "text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute right-0 bottom-0 left-0 h-[2px] rounded-full bg-white" />
                )}
              </button>
            ))}
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label={tDetails("tabs.scrollRight")}
            className="absolute top-0 right-0 bottom-0 z-10 flex items-center bg-gradient-to-l from-black/60 to-transparent pl-6 text-white/80 hover:text-white"
          >
            <Icon icon="lucide:chevron-right" className="h-5 w-5" />
          </button>
        )}
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
