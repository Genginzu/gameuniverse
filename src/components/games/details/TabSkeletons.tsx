/**
 * Skeletons spécifiques à chaque onglet de la page détail d'un jeu.
 * Chaque skeleton reproduit le layout réel de l'onglet correspondant
 * avec le style glassmorphism (bg-white/5, border-white/10, backdrop-blur).
 */

const glass =
  "rounded-xl border border-white/10 bg-white/5 shadow-lg shadow-black/20 backdrop-blur-xl";
const pulse = "animate-pulse rounded bg-white/10";

/** Classifications d'âge : grille de cards avec image + texte */
export function AgeRatingsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={`${glass} p-6`}>
          <div className="flex items-start gap-4">
            <div className={`h-20 w-16 shrink-0 ${pulse} rounded-lg`} />
            <div className="min-w-0 flex-1 space-y-2">
              <div className={`h-5 w-32 ${pulse}`} />
              <div className={`h-4 w-20 ${pulse}`} />
              <div className={`h-4 w-24 ${pulse}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Versions : colonnes masonry de cards avec cover + texte */
export function VersionsSkeleton() {
  return (
    <div className="columns-1 gap-3 md:columns-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={`mb-3 break-inside-avoid ${glass} p-4`}>
          <div className="flex gap-4">
            <div className={`h-24 w-16 shrink-0 ${pulse} rounded-lg`} />
            <div className="min-w-0 flex-1 space-y-2">
              <div className={`h-4 w-28 ${pulse}`} />
              <div className={`h-3 w-full ${pulse}`} />
              <div className={`h-3 w-3/4 ${pulse}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** DLC / Extensions : titre de catégorie + colonnes masonry de cards */
export function DlcExtensionsSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <div className={`mb-4 h-6 w-24 ${pulse}`} />
        <div className="columns-1 gap-3 md:columns-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`mb-3 break-inside-avoid ${glass} p-4`}>
              <div className="flex gap-4">
                <div className={`h-24 w-16 shrink-0 ${pulse} rounded-lg`} />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className={`h-4 w-32 ${pulse}`} />
                  <div className={`h-3 w-16 ${pulse}`} />
                  <div className={`h-3 w-full ${pulse}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Avis : card note moyenne + liste de review cards */
export function ReviewsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Average rating bar */}
      <div className={`${glass} flex items-center gap-3 px-5 py-4`}>
        <div className={`h-6 w-6 ${pulse} rounded`} />
        <div className={`h-7 w-16 ${pulse}`} />
        <div className={`h-4 w-24 ${pulse}`} />
      </div>
      {/* Review cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={`${glass} p-5`}>
          <div className="mb-4 flex items-center gap-3">
            <div className={`h-10 w-10 ${pulse} rounded-full`} />
            <div className="space-y-2">
              <div className={`h-4 w-24 ${pulse}`} />
              <div className={`h-3 w-16 ${pulse}`} />
            </div>
          </div>
          <div className="space-y-2">
            <div className={`h-3 w-full ${pulse}`} />
            <div className={`h-3 w-3/4 ${pulse}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Temps de jeu : 2 colonnes de stats */
export function PlaytimeSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className={`${glass} p-6`}>
            <div className={`mb-4 h-5 w-32 ${pulse}`} />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className={`h-4 w-24 ${pulse}`} />
                  <div className={`h-5 w-16 ${pulse}`} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Langues : 3 colonnes (interface, sous-titres, voix) */
export function LanguagesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={`${glass} p-6`}>
          <div className="mb-4 flex items-center gap-2">
            <div className={`h-5 w-5 ${pulse} rounded`} />
            <div className={`h-5 w-20 ${pulse}`} />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center gap-2">
                <div className={`h-2 w-2 ${pulse} rounded-full`} />
                <div className={`h-4 w-20 ${pulse}`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Musique : card compositeur + 2 colonnes embeds */
export function MusicSkeleton() {
  return (
    <div className="space-y-6">
      <div className={`${glass} p-6`}>
        <div className="mb-3 flex items-center gap-2">
          <div className={`h-5 w-5 ${pulse} rounded`} />
          <div className={`h-5 w-24 ${pulse}`} />
        </div>
        <div className={`h-5 w-40 ${pulse}`} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className={`${glass} p-6`}>
            <div className="mb-4 flex items-center gap-2">
              <div className={`h-5 w-5 ${pulse} rounded`} />
              <div className={`h-5 w-28 ${pulse}`} />
            </div>
            <div className={`h-[300px] w-full ${pulse} rounded-xl`} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Historique de prix : filtres + 3 stats cards + graphique */
export function PriceHistorySkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Period filters */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`h-9 w-14 ${pulse} rounded-md`} />
        ))}
      </div>
      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`${glass} p-4`}>
            <div className={`mb-2 h-4 w-24 ${pulse}`} />
            <div className={`h-7 w-20 ${pulse}`} />
          </div>
        ))}
      </div>
      {/* Chart */}
      <div className={`h-[350px] w-full ${pulse} rounded-xl`} />
    </div>
  );
}
