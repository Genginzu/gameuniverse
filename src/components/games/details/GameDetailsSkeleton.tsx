/**
 * Skeleton de chargement de la page game-detail (look éditorial).
 * Reproduit l'allure du hero plein cadre + les premières sections
 * (about + bento) pour minimiser le CLS lors du fetch des données.
 */

export function GameDetailsSkeleton() {
  return (
    <div className="editorial-game-detail">
      {/* Hero placeholder */}
      <div className="editorial-game-detail-hero">
        <div
          className="absolute inset-0 z-0"
          style={{ background: "var(--editorial-bg-2)" }}
          aria-hidden="true"
        />
        <div className="editorial-game-detail-hero-inner">
          <div className="editorial-game-detail-hero-grid">
            <div className="editorial-game-detail-hero-cover">
              <SkeletonBlock className="aspect-3/4 w-full" />
            </div>
            <div>
              <SkeletonBlock className="mb-3 h-3 w-48" />
              <SkeletonBlock className="mb-6 h-16 w-full max-w-3xl lg:h-24" />
              <SkeletonBlock className="mb-2 h-5 w-full max-w-xl" />
              <SkeletonBlock className="mb-8 h-5 w-2/3" />
              <div className="mb-8 flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonBlock key={i} className="h-7 w-20 rounded-full" />
                ))}
              </div>
              <div className="flex gap-3">
                <SkeletonBlock className="h-12 w-44 rounded-full" />
                <SkeletonBlock className="h-12 w-32 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About section placeholder */}
      <section className="editorial-game-detail-section">
        <div className="editorial-game-detail-section-grid">
          <div>
            <SkeletonBlock className="mb-3 h-3 w-32" />
            <SkeletonBlock className="h-12 w-3/4" />
          </div>
          <div className="space-y-3">
            <SkeletonBlock className="h-6 w-full" />
            <SkeletonBlock className="h-6 w-full" />
            <SkeletonBlock className="h-6 w-5/6" />
            <SkeletonBlock className="h-6 w-2/3" />
          </div>
        </div>
      </section>

      {/* Bento placeholder */}
      <section className="editorial-game-detail-section editorial-game-detail-section--tight">
        <SkeletonBlock className="mb-6 h-3 w-32" />
        <div className="editorial-game-detail-bento">
          <SkeletonBlock className="editorial-game-detail-bento-cell editorial-game-detail-bento-cell--xl h-48" />
          <SkeletonBlock className="editorial-game-detail-bento-cell h-32" />
          <SkeletonBlock className="editorial-game-detail-bento-cell h-32" />
          <SkeletonBlock className="editorial-game-detail-bento-cell h-32" />
          <SkeletonBlock className="editorial-game-detail-bento-cell h-32" />
        </div>
      </section>
    </div>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`editorial-game-detail-skeleton animate-pulse ${className}`.trim()} />;
}
