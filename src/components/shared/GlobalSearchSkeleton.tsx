"use client";

/** Skeleton mimant la structure des résultats de recherche globale */
export function GlobalSearchSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Skeleton grille de jeux */}
      <section>
        <div className="flex items-center gap-2.5 border-b border-white/10 pb-2">
          <div className="h-4 w-4 rounded bg-white/10" />
          <div className="h-3.5 w-16 rounded bg-white/10" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`game-${i}`}>
              <div className="aspect-3/4 w-full rounded-lg bg-white/5" />
              <div className="mt-2.5 space-y-1.5 px-0.5">
                <div className="h-3.5 w-3/4 rounded bg-white/10" />
                <div className="h-3 w-1/3 rounded bg-white/8" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skeleton personnages + joueurs */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Personnages */}
        <section>
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-2">
            <div className="h-4 w-4 rounded bg-white/10" />
            <div className="h-3.5 w-24 rounded bg-white/10" />
          </div>
          <div className="mt-3 space-y-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`char-${i}`} className="flex items-center gap-4 rounded-lg px-4 py-3">
                <div className="h-11 w-11 shrink-0 rounded-full bg-white/10" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="h-4 w-2/3 rounded bg-white/10" />
                  <div className="h-3 w-1/2 rounded bg-white/8" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Joueurs */}
        <section>
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-2">
            <div className="h-4 w-4 rounded bg-white/10" />
            <div className="h-3.5 w-16 rounded bg-white/10" />
          </div>
          <div className="mt-3 space-y-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`player-${i}`} className="flex items-center gap-4 rounded-lg px-4 py-3">
                <div className="h-11 w-11 shrink-0 rounded-full bg-white/10" />
                <div className="min-w-0 flex-1">
                  <div className="h-4 w-1/2 rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
