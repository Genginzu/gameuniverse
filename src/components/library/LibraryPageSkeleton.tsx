/**
 * Skeleton de chargement de la page bibliothèque (look éditorial).
 * Reproduit le hero (titre + stats inline) + barre de recherche +
 * grille de cartes. Style Tailwind inline.
 */

import { GridSkeleton } from "@/components/shared/GridSkeleton";
import { gameSkeletonConfig } from "@/components/shared/EntitySkeleton";

const PULSE = "animate-pulse rounded bg-white/10";

export function LibraryPageSkeleton() {
  return (
    <section className="w-full">
      <div className="mx-auto max-w-[1536px] px-4 pt-8 pb-16 md:px-8 md:pt-12 md:pb-20">
        {/* Hero placeholder */}
        <header className="mb-12 grid grid-cols-1 gap-4 lg:grid-cols-[5fr_7fr] lg:items-end lg:gap-12">
          <div>
            <div className={`mb-3 h-3 w-24 ${PULSE}`} />
            <div className={`mb-3 h-12 w-3/4 max-w-md ${PULSE}`} />
            <div className={`h-4 w-full max-w-lg ${PULSE}`} />
          </div>
          <div className="border-editorial-line grid grid-cols-2 gap-6 border-y py-6 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className={`mb-2 h-8 w-16 ${PULSE}`} />
                <div className={`h-3 w-20 ${PULSE}`} />
              </div>
            ))}
          </div>
        </header>

        {/* Controls placeholder */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className={`h-12 flex-1 rounded-xl ${PULSE}`} />
          <div className={`h-12 w-12 shrink-0 rounded-xl sm:w-32 ${PULSE}`} />
        </div>

        {/* Grid placeholder */}
        <GridSkeleton skeletonConfig={gameSkeletonConfig} count={20} />
      </div>
    </section>
  );
}
