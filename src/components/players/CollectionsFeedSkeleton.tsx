import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dedicated skeleton matching the PlayerCollectionsListView layout:
 * - 2x2 / 3 / 4 responsive grid of collection cards
 * - Each card: aspect-video thumbnail + 2 text lines
 */
export function CollectionsFeedSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl">
          <Skeleton className="aspect-video w-full bg-gray-200 dark:bg-slate-700" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-3/4 bg-gray-200 dark:bg-slate-700" />
            <Skeleton className="h-3 w-1/2 bg-gray-200 dark:bg-slate-700" />
          </div>
        </div>
      ))}
    </div>
  );
}
