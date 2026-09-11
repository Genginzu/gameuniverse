import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton for the collection list page (grid of card placeholders).
 * Mirrors the CollectionCard layout: cover area + info section.
 * Editorial (dark) tokens so it renders correctly on the always-dark pages.
 */
export function CollectionListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="border-editorial-line bg-editorial-2 overflow-hidden rounded-2xl border"
        >
          <Skeleton className="aspect-16/10 w-full rounded-none bg-white/10" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-5 w-3/4 bg-white/10" />
            <Skeleton className="h-4 w-full bg-white/10" />
            <Skeleton className="h-3 w-1/3 bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for the collection detail page.
 * Mirrors CollectionDetail: header card + game cards grid.
 */
export function CollectionDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header card */}
      <div className="border-editorial-line bg-editorial-2 rounded-2xl border p-6">
        {/* Title */}
        <Skeleton className="h-7 w-1/2 bg-white/10" />

        {/* Description */}
        <Skeleton className="mt-3 h-4 w-full bg-white/10" />
        <Skeleton className="mt-1 h-4 w-3/4 bg-white/10" />

        {/* Meta: owner, games count, date */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full bg-white/10" />
            <Skeleton className="h-4 w-24 bg-white/10" />
          </div>
          <Skeleton className="h-4 w-16 bg-white/10" />
          <Skeleton className="h-4 w-32 bg-white/10" />
        </div>
      </div>

      {/* Games list section */}
      <div>
        <Skeleton className="mb-4 h-5 w-32 bg-white/10" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border-editorial-line bg-editorial-2 overflow-hidden rounded-2xl border"
            >
              <Skeleton className="aspect-3/4 w-full rounded-none bg-white/10" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-5 w-3/4 bg-white/10" />
                <Skeleton className="h-3 w-1/2 bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
