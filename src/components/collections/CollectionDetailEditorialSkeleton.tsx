/**
 * Skeleton de chargement de la page Collection detail (look éditorial).
 * Reproduit le hero (cover + meta + actions) et la grille de jeux.
 */

const PULSE = "animate-pulse rounded bg-white/10";
const GAME_COUNT = 12;

export function CollectionDetailEditorialSkeleton() {
  return (
    <section className="editorial-collection-detail">
      <div className="editorial-collection-detail-inner">
        <div className={`mb-6 h-3 w-32 ${PULSE}`} />

        <header className="editorial-collection-detail-hero">
          <div className="editorial-collection-detail-skeleton-cover" />

          <div className="editorial-collection-detail-body">
            <div>
              <div className={`mb-3 h-3 w-24 ${PULSE}`} />
              <div className={`mb-3 h-10 w-3/4 max-w-md ${PULSE}`} />
              <div className={`mb-2 h-4 w-full max-w-lg ${PULSE}`} />
              <div className={`h-4 w-2/3 max-w-md ${PULSE}`} />
            </div>

            <div className="editorial-collection-detail-meta">
              <div className={`h-8 w-32 rounded-full ${PULSE}`} />
              <div className={`h-6 w-24 ${PULSE}`} />
              <div className={`h-6 w-32 ${PULSE}`} />
            </div>

            <div className="editorial-collection-detail-actions">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`h-10 w-28 rounded-[10px] ${PULSE}`} />
              ))}
            </div>
          </div>
        </header>

        <header className="editorial-collection-detail-games-header">
          <div>
            <div className={`mb-3 h-3 w-24 ${PULSE}`} />
            <div className={`h-7 w-48 ${PULSE}`} />
          </div>
        </header>

        <div className="editorial-collection-detail-games-grid">
          {Array.from({ length: GAME_COUNT }).map((_, i) => (
            <div
              key={i}
              className="editorial-collection-game-card"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div
                className="editorial-collection-game-card-cover animate-pulse"
                style={{ background: "rgba(255,255,255,0.06)" }}
              />
              <div className={`h-3 w-3/4 ${PULSE}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
