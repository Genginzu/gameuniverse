/**
 * Skeleton de chargement de la page Collection detail (look éditorial).
 * Reproduit le hero (cover + meta + actions) et la grille de jeux.
 * Style Tailwind inline.
 */

const PULSE = "animate-pulse rounded bg-white/10";
const GAME_COUNT = 12;

export function CollectionDetailEditorialSkeleton() {
  return (
    <section className="w-full">
      <div className="mx-auto max-w-[1536px] px-4 pt-6 pb-16 md:px-8 md:pt-10 md:pb-20">
        <div className={`mb-6 h-3 w-32 ${PULSE}`} />

        <header className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-[5fr_7fr] lg:items-stretch lg:gap-12">
          <div className="border-editorial-line aspect-[16/10] animate-pulse rounded-[1.25rem] border bg-white/[0.03] lg:aspect-auto lg:min-h-[320px]" />

          <div className="flex flex-col justify-between gap-6">
            <div>
              <div className={`mb-3 h-3 w-24 ${PULSE}`} />
              <div className={`mb-3 h-10 w-3/4 max-w-md ${PULSE}`} />
              <div className={`mb-2 h-4 w-full max-w-lg ${PULSE}`} />
              <div className={`h-4 w-2/3 max-w-md ${PULSE}`} />
            </div>

            <div className="border-editorial-line flex flex-wrap items-center gap-5 border-y py-4">
              <div className={`h-8 w-32 rounded-full ${PULSE}`} />
              <div className={`h-6 w-24 ${PULSE}`} />
              <div className={`h-6 w-32 ${PULSE}`} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`h-10 w-28 rounded-[10px] ${PULSE}`} />
              ))}
            </div>
          </div>
        </header>

        <header className="mb-6">
          <div className={`mb-3 h-3 w-24 ${PULSE}`} />
          <div className={`h-7 w-48 ${PULSE}`} />
        </header>

        <div className="grid grid-cols-2 gap-4 min-[475px]:grid-cols-3 md:grid-cols-4 md:gap-5 lg:grid-cols-5 xl:grid-cols-6 min-[1536px]:grid-cols-7">
          {Array.from({ length: GAME_COUNT }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="border-editorial-line aspect-[3/4] animate-pulse rounded-[0.625rem] border bg-white/[0.06]" />
              <div className={`h-3 w-3/4 ${PULSE}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
