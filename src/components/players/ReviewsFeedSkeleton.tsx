import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dedicated skeleton matching the PlayerReviewsFeed layout:
 * - Stats block (2 metrics + distribution bars)
 * - Sort selector placeholder
 * - 3 review cards (cover image + text lines)
 */
export function ReviewsFeedSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats block skeleton */}
      <div className="glass-card animate-pulse rounded-2xl p-6">
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Total reviews metric */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-12" />
            </div>
          </div>
          {/* Average rating metric */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </div>
        {/* Distribution bars */}
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-5 flex-1 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Sort selector placeholder */}
      <div className="flex justify-end">
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      {/* Review cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="glass-card animate-pulse rounded-xl p-5">
          <div className="mb-4 flex gap-4">
            <div className="h-20 w-14 rounded-lg bg-gray-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-slate-700" />
              <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-slate-700" />
              <div className="h-6 w-16 rounded bg-gray-200 dark:bg-slate-700" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
