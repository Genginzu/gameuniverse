import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton glassmorphism pour la page détail d'un jeu.
 * Reproduit le layout 2 colonnes : sidebar sticky + contenu principal.
 */
export function GameDetailsSkeleton() {
  return (
    <div className="relative min-h-screen bg-slate-900">
      {/* Faux background gradient */}
      <div className="absolute inset-x-0 top-0 z-0 h-[70vh] bg-linear-to-b from-slate-800 to-slate-900" />

      {/* Nav bar skeleton */}
      <div className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="container mx-auto flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-8 w-8 rounded-lg bg-white/10" />
          <Skeleton className="h-4 w-24 bg-white/10" />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="relative z-10 container mx-auto px-4 pt-20 pb-16">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar */}
          <SidebarSkeleton />
          {/* Main content */}
          <MainContentSkeleton />
        </div>
      </div>
    </div>
  );
}

/** Skeleton de la sidebar : cover + boutons + meta */
function SidebarSkeleton() {
  return (
    <div className="w-full shrink-0 lg:w-[320px]">
      <div className="sticky top-24 space-y-4">
        {/* Cover image */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/20 backdrop-blur-xl">
          <Skeleton className="aspect-3/4 w-full bg-white/10" />
        </div>

        {/* Library button */}
        <Skeleton className="h-12 w-full rounded-xl bg-white/10" />

        {/* Share button */}
        <Skeleton className="h-12 w-full rounded-xl bg-white/10" />

        {/* Meta info card */}
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/20 backdrop-blur-xl">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20 bg-white/10" />
              <Skeleton className="h-4 w-36 bg-white/10" />
            </div>
          ))}
          {/* Platforms */}
          <div className="flex flex-wrap gap-2 pt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full bg-white/10" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Skeleton du contenu principal : titre + onglets + stats + media */
function MainContentSkeleton() {
  return (
    <div className="min-w-0 flex-1">
      {/* Platform badges */}
      <div className="mb-3 flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full bg-white/10" />
        ))}
      </div>

      {/* Title */}
      <Skeleton className="mb-6 h-12 w-3/4 bg-white/10 lg:h-14" />

      {/* Tab navigation */}
      <div className="mb-8 flex gap-6 border-b border-white/10 pb-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-16 bg-white/10" />
        ))}
      </div>

      {/* Description */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-4 w-full bg-white/10" />
        <Skeleton className="h-4 w-full bg-white/10" />
        <Skeleton className="h-4 w-2/3 bg-white/10" />
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/10 backdrop-blur-xl"
          >
            <Skeleton className="h-4 w-4 rounded bg-white/10" />
            <Skeleton className="h-6 w-16 bg-white/10" />
            <Skeleton className="h-3 w-20 bg-white/10" />
          </div>
        ))}
      </div>

      {/* Media gallery placeholder */}
      <div className="space-y-4">
        <Skeleton className="aspect-video w-full rounded-xl bg-white/10" />
        <div className="grid grid-cols-4 gap-3 md:grid-cols-6 lg:grid-cols-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video w-full rounded-xl bg-white/10" />
          ))}
        </div>
      </div>
    </div>
  );
}
