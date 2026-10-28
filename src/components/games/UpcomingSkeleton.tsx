import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";

import { GameCardSkeleton } from "./GameCardSkeleton";
import { UPCOMING_GRID } from "./upcomingGrid";

const BLOCK = "animate-pulse rounded bg-white/[0.06] motion-reduce:animate-none";
/** "All months" chip, then the next 12 months. */
const MONTH_CHIP_WIDTHS = [112, 92, 96, 84, 80, 76, 88, 84, 96, 100, 92, 96, 88];

/** Dark editorial skeleton of the upcoming releases page, laid out like the real page. */
export function UpcomingSkeleton() {
  return (
    <section className="w-full" aria-hidden="true" data-testid="upcoming-skeleton">
      <EditorialContainer>
        <div className="mb-8 flex flex-col gap-3">
          <div className={`${BLOCK} h-4 w-28`} />
          <div
            className={`${BLOCK} h-[clamp(2.1rem,4.2vw+1rem,3.7rem)] w-72 max-w-full sm:w-[28rem]`}
          />
          <div className={`${BLOCK} h-5 w-64 max-w-full sm:w-80`} />
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {MONTH_CHIP_WIDTHS.map((width, index) => (
            <div key={index} className={`${BLOCK} h-[30px] rounded-full`} style={{ width }} />
          ))}
        </div>

        <div className={UPCOMING_GRID}>
          {Array.from({ length: 12 }).map((_, index) => (
            <GameCardSkeleton key={index} />
          ))}
        </div>
      </EditorialContainer>
    </section>
  );
}
