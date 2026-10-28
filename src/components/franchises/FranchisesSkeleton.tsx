import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";

import { FRANCHISE_CARD_SKELETON, FRANCHISES_GRID } from "./franchisesGrid";

const BLOCK = "animate-pulse rounded bg-white/[0.06] motion-reduce:animate-none";

/** Dark editorial skeleton of the franchises listing, laid out like the real page. */
export function FranchisesSkeleton() {
  return (
    <section className="w-full" aria-hidden="true" data-testid="franchises-skeleton">
      <EditorialContainer>
        <div className="mb-8 flex flex-col gap-3 md:mb-10">
          <div className={`${BLOCK} h-4 w-24`} />
          <div
            className={`${BLOCK} h-[clamp(2.1rem,4.2vw+1rem,3.7rem)] w-72 max-w-full sm:w-[30rem]`}
          />
          <div className={`${BLOCK} h-5 w-80 max-w-full sm:h-6 sm:w-[32rem]`} />
        </div>

        <div className={`${BLOCK} mb-6 h-14 max-w-xl rounded-[14px]`} />

        <div className={FRANCHISES_GRID}>
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className={FRANCHISE_CARD_SKELETON} />
          ))}
        </div>
      </EditorialContainer>
    </section>
  );
}
