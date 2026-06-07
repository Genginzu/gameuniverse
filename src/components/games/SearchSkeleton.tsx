import { GridSkeleton } from "@/components/shared/GridSkeleton";
import { gameSkeletonConfig } from "@/components/shared/EntitySkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function SearchSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Filter button skeleton */}
      <div className="mb-6 space-y-4 sm:mb-8">
        <Skeleton className="h-12 w-12 rounded-xl sm:h-14 sm:w-28" />
      </div>

      {/* Game cards grid skeleton */}
      <GridSkeleton skeletonConfig={gameSkeletonConfig} count={20} />
    </div>
  );
}
