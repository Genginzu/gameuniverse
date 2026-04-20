/**
 * Skeletons for media-related tabs: age ratings, versions, DLC, music.
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
