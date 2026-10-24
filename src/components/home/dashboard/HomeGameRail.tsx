"use client";

/**
 * HomeGameRail : compact horizontal rail of `GameCard`s.
 *
 * Touch devices get scroll-snap; mouse users get wheel → horizontal scrolling
 * (`useHorizontalWheelScroll`). Snap is disabled on fine pointers because
 * mandatory snapping would cancel the small programmatic wheel steps.
 * Shows editorial card skeletons while loading and the provided empty state
 * once loaded without items.
 */

import type { ReactNode } from "react";

import { GameCard, type GameCardOverlay } from "@/components/games/GameCard";
import { GameCardSkeleton } from "@/components/games/GameCardSkeleton";
import { useHorizontalWheelScroll } from "@/hooks/useHorizontalWheelScroll";
import type { GameSummary } from "@/types/game";
import { HOME_RAIL_ITEM as ITEM_CLASSES } from "./layout";

export interface HomeRailItem {
  game: GameSummary;
  overlay?: GameCardOverlay;
  /** Control layered over the card (positioned absolutely by the caller). */
  action?: ReactNode;
  /** Short text under the card (e.g. why it is recommended). */
  caption?: string;
}

interface HomeGameRailProps {
  label: string;
  items: HomeRailItem[];
  isLoading: boolean;
  empty: ReactNode;
  /** Number of leading covers loaded with `priority`. */
  priorityCount?: number;
}

const SKELETON_COUNT = 6;

const RAIL_CLASSES =
  "editorial-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 pointer-fine:snap-none md:-mx-8 md:gap-5 md:px-8 lg:mx-0 lg:px-0";

export function HomeGameRail({
  label,
  items,
  isLoading,
  empty,
  priorityCount = 0,
}: HomeGameRailProps) {
  const railRef = useHorizontalWheelScroll<HTMLUListElement>();

  if (isLoading && items.length === 0) {
    return (
      <div className={RAIL_CLASSES} aria-busy="true" aria-label={label}>
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <div key={index} className={ITEM_CLASSES}>
            <GameCardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) return <>{empty}</>;

  return (
    <ul ref={railRef} className={RAIL_CLASSES} aria-label={label}>
      {items.map(({ game, overlay, action, caption }, index) => (
        <li key={game.id} className={`${ITEM_CLASSES} flex flex-col gap-2`}>
          {/* The action is a sibling of the card link: no button nested in <a>. */}
          <div className="group/card relative">
            <GameCard game={game} overlay={overlay} priority={index < priorityCount} />
            {action}
          </div>
          {caption && (
            <p className="text-editorial-muted line-clamp-2 px-0.5 text-xs leading-snug sm:text-sm">
              {caption}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
