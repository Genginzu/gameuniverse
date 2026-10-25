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
import { LibraryStatusProvider } from "@/components/providers/LibraryStatusProvider";
import { useHorizontalWheelScroll } from "@/hooks/useHorizontalWheelScroll";
import type { GameSummary } from "@/types/game";
import { HOME_RAIL_ITEM as ITEM_CLASSES } from "./layout";

export interface HomeRailItem {
  game: GameSummary;
  overlay?: GameCardOverlay;
  /** Controls layered over the card (positioned absolutely by the caller). */
  action?: ReactNode;
}

interface HomeGameRailProps {
  label: string;
  items: HomeRailItem[];
  isLoading: boolean;
  empty: ReactNode;
  /** Number of leading covers loaded with `priority`. */
  priorityCount?: number;
  /** Offers the quick "add to library" button (statuses seeded in one request). */
  quickAdd?: boolean;
  /** Extra items appended after a labelled separator (e.g. suggestions). */
  suggestions?: { label: string; items: HomeRailItem[] };
}

const SKELETON_COUNT = 6;

const RAIL_CLASSES =
  "editorial-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 pointer-fine:snap-none md:-mx-8 md:gap-5 md:px-8 lg:mx-0 lg:px-0";

/** Vertical separator announcing the suggestion cards that follow. */
function SuggestionsSeparator({ label }: { label: string }) {
  return (
    <li
      data-testid="rail-suggestions-separator"
      className="text-editorial-accent flex shrink-0 flex-col items-center gap-3 py-2"
    >
      <span className="border-editorial-accent/50 w-px flex-1 border-l border-dashed" aria-hidden />
      <span className="font-mono text-[0.7rem] font-semibold tracking-[0.18em] uppercase [writing-mode:vertical-rl] rotate-180">
        {label}
      </span>
      <span className="border-editorial-accent/50 w-px flex-1 border-l border-dashed" aria-hidden />
    </li>
  );
}

export function HomeGameRail({
  label,
  items,
  isLoading,
  empty,
  priorityCount = 0,
  quickAdd = false,
  suggestions,
}: HomeGameRailProps) {
  const railRef = useHorizontalWheelScroll<HTMLUListElement>();
  const extraItems = suggestions?.items ?? [];
  const allItems = [...items, ...extraItems];

  if (isLoading && allItems.length === 0) {
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

  if (allItems.length === 0) return <>{empty}</>;

  const renderItem = ({ game, overlay, action }: HomeRailItem, index: number) => (
    <li key={game.id} className={ITEM_CLASSES}>
      <GameCard
        game={game}
        overlay={overlay}
        priority={index < priorityCount}
        actions={action}
        quickAdd={quickAdd}
      />
    </li>
  );

  const rail = (
    <ul ref={railRef} className={RAIL_CLASSES} aria-label={label}>
      {items.map(renderItem)}
      {suggestions && items.length > 0 && extraItems.length > 0 && (
        <SuggestionsSeparator label={suggestions.label} />
      )}
      {extraItems.map((item, index) => renderItem(item, items.length + index))}
    </ul>
  );

  if (!quickAdd) return rail;
  return (
    <LibraryStatusProvider gameIds={allItems.map(({ game }) => game.id)}>{rail}</LibraryStatusProvider>
  );
}
