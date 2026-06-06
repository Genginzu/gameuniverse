/**
 * Skeleton de chargement de la page Collections (look éditorial).
 * Reproduit le hero (titre + stats inline) + barre de contrôles + grille
 * de cartes. Style Tailwind inline.
 */

const PULSE = "animate-pulse rounded bg-white/10";

const SKELETON_CARD_COUNT = 8;

export function CollectionsPageSkeleton() {
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
          <div className="border-editorial-line grid grid-cols-2 gap-6 border-y py-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <div className={`mb-2 h-8 w-16 ${PULSE}`} />
                <div className={`h-3 w-20 ${PULSE}`} />
              </div>
            ))}
          </div>
        </header>

        {/* Controls placeholder */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className={`h-3 w-32 ${PULSE}`} />
          <div className={`h-12 w-44 rounded-xl ${PULSE}`} />
        </div>

        {/* Grid placeholder */}
        <div className="grid grid-cols-1 gap-4 min-[475px]:grid-cols-2 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
          {Array.from({ length: SKELETON_CARD_COUNT }).map((_, i) => (
            <div
              key={i}
              className="border-editorial-line bg-editorial-2 animate-pulse overflow-hidden rounded-2xl border"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="aspect-[16/10] bg-white/[0.03]" />
              <div className="flex flex-col gap-2 px-[1.125rem] pt-4 pb-[1.125rem]">
                <div className="h-3.5 w-3/4 rounded bg-white/8" />
                <div className="h-3.5 w-full rounded bg-white/8" />
                <div className="h-3.5 w-1/3 rounded bg-white/8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
