/**
 * HomeDashboardSkeleton : neutral dark placeholder shown while the session of
 * a probably logged-in user (auth cookie present) is being resolved.
 */

import { GameCardSkeleton } from "@/components/games/GameCardSkeleton";
import { HOME_DASHBOARD_SHELL, HOME_DASHBOARD_STACK, HOME_RAIL_ITEM } from "./dashboard/layout";

interface HomeDashboardSkeletonProps {
  className?: string;
}

const RAIL_COUNT = 2;
const CARD_COUNT = 6;

export function HomeDashboardSkeleton({ className = "" }: HomeDashboardSkeletonProps) {
  return (
    <div
      className={`${HOME_DASHBOARD_SHELL} ${className}`.trim()}
      aria-hidden="true"
      data-testid="home-dashboard-skeleton"
    >
      <div className={`${HOME_DASHBOARD_STACK} animate-pulse`}>
        <div className="flex items-start gap-4 sm:gap-5">
          <div className="bg-editorial-2 size-14 shrink-0 rounded-2xl sm:size-20" />
          <div className="flex flex-1 flex-col gap-3">
            <div className="h-3 w-24 rounded bg-white/[0.06]" />
            <div className="h-10 w-3/4 max-w-md rounded-lg bg-white/[0.06]" />
            <div className="h-2 w-full max-w-sm rounded-full bg-white/[0.06]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="bg-editorial-2 h-14 rounded-2xl sm:h-[4.5rem]" />
          ))}
        </div>
        {Array.from({ length: RAIL_COUNT }, (_, rail) => (
          <div key={rail} className="flex flex-col gap-5">
            <div className="h-7 w-48 rounded-lg bg-white/[0.06]" />
            <div className="flex gap-4 overflow-hidden md:gap-5">
              {Array.from({ length: CARD_COUNT }, (_, index) => (
                <div key={index} className={HOME_RAIL_ITEM}>
                  <GameCardSkeleton />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
