/**
 * Skeleton de chargement de la page bibliothèque (look éditorial).
 * Reproduit le hero (titre + stats inline) + barre de recherche +
 * grille de cartes.
 */

import { GridSkeleton } from "@/components/shared/GridSkeleton";
import { gameSkeletonConfig } from "@/components/shared/EntitySkeleton";

const PULSE = "animate-pulse rounded bg-white/10";

export function LibraryPageSkeleton() {
  return (
    <section className="editorial-library">
      <div className="editorial-library-inner">
        {/* Hero placeholder */}
        <header className="editorial-library-hero">
          <div>
            <div className={`mb-3 h-3 w-24 ${PULSE}`} />
            <div className={`mb-3 h-12 w-3/4 ${PULSE} max-w-md`} />
            <div className={`h-4 w-full max-w-lg ${PULSE}`} />
          </div>
          <div className="editorial-library-stats">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className={`mb-2 h-8 w-16 ${PULSE}`} />
                <div className={`h-3 w-20 ${PULSE}`} />
              </div>
            ))}
          </div>
        </header>

        {/* Controls placeholder */}
        <div className="editorial-library-controls">
          <div className={`h-12 flex-1 rounded-xl ${PULSE}`} />
          <div className={`h-12 w-12 shrink-0 rounded-xl ${PULSE} sm:w-32`} />
        </div>

        {/* Grid placeholder */}
        <GridSkeleton skeletonConfig={gameSkeletonConfig} count={20} />
      </div>
    </section>
  );
}
