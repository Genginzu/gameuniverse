import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";
import { TRENDING_SECTION_SIZE } from "@/lib/listing/resources/games";

import { GameCardSkeleton } from "./GameCardSkeleton";
import { TRENDING_GRID, TRENDING_SECTION_KEYS } from "./trendingGrid";

const BLOCK = "animate-pulse rounded bg-white/[0.06] motion-reduce:animate-none";

/** Skeleton of the trending sections only (title + full grid each). */
export function TrendingSectionsSkeleton() {
  return (
    <>
      {TRENDING_SECTION_KEYS.map((key) => (
        <section key={key} className="mb-12 md:mb-16">
          <div className="mb-6 flex items-baseline gap-4">
            <div className={`${BLOCK} h-8 w-56`} />
            <div className={`${BLOCK} h-4 w-16`} />
          </div>
          <div className={TRENDING_GRID}>
            {Array.from({ length: TRENDING_SECTION_SIZE }).map((_, index) => (
              <GameCardSkeleton key={index} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

/** Dark editorial skeleton of the whole trending page, laid out like the real page. */
export function TrendingSkeleton() {
  return (
    <section className="w-full" aria-hidden="true" data-testid="trending-skeleton">
      <EditorialContainer>
        <div className="mb-12 flex flex-col gap-3">
          <div className={`${BLOCK} h-4 w-24`} />
          <div className={`${BLOCK} h-[clamp(2.1rem,4.2vw+1rem,3.7rem)] w-64 sm:w-80`} />
          <div className={`${BLOCK} h-6 w-80 max-w-full sm:w-96`} />
        </div>
        <TrendingSectionsSkeleton />
      </EditorialContainer>
    </section>
  );
}
