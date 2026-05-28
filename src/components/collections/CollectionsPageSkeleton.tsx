/**
 * Skeleton de chargement de la page Collections (look éditorial).
 * Reproduit le hero (titre + stats inline) + barre de contrôles + grille
 * de cartes.
 */

const PULSE = "animate-pulse rounded bg-white/10";

const SKELETON_CARD_COUNT = 8;

export function CollectionsPageSkeleton() {
  return (
    <section className="editorial-collections">
      <div className="editorial-collections-inner">
        {/* Hero placeholder */}
        <header className="editorial-collections-hero">
          <div>
            <div className={`mb-3 h-3 w-24 ${PULSE}`} />
            <div className={`mb-3 h-12 w-3/4 max-w-md ${PULSE}`} />
            <div className={`h-4 w-full max-w-lg ${PULSE}`} />
          </div>
          <div className="editorial-collections-stats">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <div className={`mb-2 h-8 w-16 ${PULSE}`} />
                <div className={`h-3 w-20 ${PULSE}`} />
              </div>
            ))}
          </div>
        </header>

        {/* Controls placeholder */}
        <div className="editorial-collections-controls">
          <div className={`h-3 w-32 ${PULSE}`} />
          <div className={`h-12 w-44 rounded-xl ${PULSE}`} />
        </div>

        {/* Grid placeholder */}
        <div className="editorial-collections-grid">
          {Array.from({ length: SKELETON_CARD_COUNT }).map((_, i) => (
            <div
              key={i}
              className="editorial-collections-skeleton-card"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="editorial-collections-skeleton-cover" />
              <div className="editorial-collections-skeleton-body">
                <div className="editorial-collections-skeleton-line w-3/4" />
                <div className="editorial-collections-skeleton-line w-full" />
                <div className="editorial-collections-skeleton-line w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
