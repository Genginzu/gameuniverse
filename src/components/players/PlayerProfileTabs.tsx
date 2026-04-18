"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

export type ProfileTab =
  | "feed"
  | "activity"
  | "library"
  | "friends"
  | "reviews"
  | "collections"
  | "achievements"
  | "stats"
  | "recommendations"
  | "settings";

/** Returns the default tab displayed when the profile page mounts. */
export function getDefaultTab(isOwner: boolean): ProfileTab {
  return isOwner ? "feed" : "activity";
}

interface PlayerProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  isOwner: boolean;
}

const TAB_DEFINITIONS: {
  id: ProfileTab;
  icon: string;
  ownerOnly?: boolean;
}[] = [
  { id: "feed", icon: "lucide:newspaper", ownerOnly: true },
  { id: "activity", icon: "lucide:smile" },
  { id: "library", icon: "lucide:gamepad-2" },
  { id: "friends", icon: "lucide:users" },
  { id: "reviews", icon: "lucide:book-open" },
  { id: "collections", icon: "lucide:folder-open" },
  { id: "achievements", icon: "lucide:trophy" },
  { id: "stats", icon: "lucide:bar-chart-3" },
  { id: "recommendations", icon: "lucide:globe", ownerOnly: true },
  { id: "settings", icon: "lucide:settings", ownerOnly: true },
];

export function PlayerProfileTabs({ activeTab, onTabChange, isOwner }: PlayerProfileTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("players.tabs");
  const [tooltip, setTooltip] = useState<{ label: string; x: number; y: number } | null>(null);

  const visibleTabs = TAB_DEFINITIONS.filter((tab) => !tab.ownerOnly || isOwner);

  const scroll = (direction: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: direction === "left" ? -120 : 120, behavior: "smooth" });
  };

  const showTooltip = (e: React.MouseEvent, label: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ label, x: rect.left + rect.width / 2, y: rect.top });
  };

  return (
    <div className="relative border-b border-gray-200 bg-white/50 dark:border-slate-700/50 dark:bg-slate-800/30">
      <button
        type="button"
        onClick={() => scroll("left")}
        className="absolute top-1/2 left-0 z-10 -translate-y-1/2 rounded-r-md bg-white/80 p-1 text-gray-500 hover:text-gray-900 md:hidden dark:bg-slate-800/80 dark:text-slate-400 dark:hover:text-white"
        aria-label="Scroll left"
      >
        <Icon icon="lucide:chevron-left" className="h-4 w-4" />
      </button>

      <div
        ref={scrollRef}
        role="tablist"
        className="scrollbar-hide flex overflow-x-auto px-6 md:justify-center md:px-0"
      >
        {visibleTabs.map(({ id, icon }) => {
          const isActive = activeTab === id;
          const label = t(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTooltip(null);
                onTabChange(id);
              }}
              onMouseEnter={(e) => showTooltip(e, label)}
              onMouseLeave={() => setTooltip(null)}
              className={`relative flex shrink-0 cursor-pointer items-center justify-center px-5 py-3 transition-colors ${
                isActive
                  ? "text-cyan-600 dark:text-cyan-400"
                  : "text-gray-400 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
              aria-label={label}
              aria-selected={isActive}
              role="tab"
            >
              <Icon icon={icon} className="h-5 w-5" />
              {isActive && (
                <>
                  <span className="ml-2 hidden text-sm font-medium md:inline">{label}</span>
                  <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-cyan-600 dark:bg-cyan-400" />
                </>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => scroll("right")}
        className="absolute top-1/2 right-0 z-10 -translate-y-1/2 rounded-l-md bg-white/80 p-1 text-gray-500 hover:text-gray-900 md:hidden dark:bg-slate-800/80 dark:text-slate-400 dark:hover:text-white"
        aria-label="Scroll right"
      >
        <Icon icon="lucide:chevron-right" className="h-4 w-4" />
      </button>

      {/* Comic-style speech bubble — rendered via fixed position to escape overflow */}
      {tooltip && <BubbleTooltip label={tooltip.label} x={tooltip.x} y={tooltip.y} />}
    </div>
  );
}

/** Floating comic-book speech bubble positioned above the hovered tab */
function BubbleTooltip({ label, x, y }: { label: string; x: number; y: number }) {
  return (
    <div
      className="animate-scale-in pointer-events-none fixed z-50 -translate-x-1/2"
      style={{ left: x, top: y - 44 }}
    >
      <div className="relative rounded-xl border-2 border-indigo-400 bg-white px-3 py-1.5 text-xs font-bold whitespace-nowrap text-gray-900 shadow-lg shadow-indigo-500/20 dark:bg-slate-900 dark:text-white">
        {label}
        {/* Tail — outer border triangle */}
        <span className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 border-x-[7px] border-t-[7px] border-x-transparent border-t-indigo-400" />
        {/* Tail — inner fill triangle */}
        <span className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent border-t-white dark:border-t-slate-900" />
      </div>
    </div>
  );
}
