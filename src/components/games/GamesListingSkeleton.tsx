import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";

import { GameCardSkeleton } from "./GameCardSkeleton";
import { GAMES_LISTING_GRID } from "./gamesListingGrid";

const BLOCK = "animate-pulse rounded bg-white/[0.06] motion-reduce:animate-none";

/** Dark editorial skeleton of the games listing, laid out like the real page (header, toolbar, grid). */
export function GamesListingSkeleton() {
  return (
    <section className="w-full" aria-hidden="true" data-testid="games-listing-skeleton">
      <EditorialContainer>
        <div className="mb-10 flex flex-col gap-3">
          <div className={`${BLOCK} h-4 w-24`} />
          <div className={`${BLOCK} h-[clamp(2.1rem,4.2vw+1rem,3.7rem)] w-64 sm:w-80`} />
          <div className={`${BLOCK} h-5 w-72 max-w-full sm:w-96`} />
        </div>

        <div className="mb-5 flex items-center justify-between gap-3">
          <div className={`${BLOCK} h-12 w-28 rounded-xl sm:h-14`} />
          <div className={`${BLOCK} h-12 w-12 rounded-xl sm:h-14 sm:w-60`} />
        </div>

        <div className="mb-6" />

        <div className={GAMES_LISTING_GRID}>
          {Array.from({ length: 20 }).map((_, index) => (
            <GameCardSkeleton key={index} />
          ))}
        </div>
      </EditorialContainer>
    </section>
  );
}
