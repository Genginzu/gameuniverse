import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton for the collection list page (grid of card placeholders).
 * Mirrors the CollectionCard layout: cover area + info section.
 */
export function CollectionListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-md dark:bg-gray-800">
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-1/3" />
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
      <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
        {/* Title */}
        <Skeleton className="h-7 w-1/2" />

        {/* Description */}
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-3/4" />

        {/* Meta: owner, games count, date */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Games list section */}
      <div>
        <Skeleton className="mb-4 h-5 w-32" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl bg-white shadow-md dark:bg-gray-800"
            >
              <Skeleton className="aspect-[3/4] w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
