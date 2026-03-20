import { Skeleton } from "@/components/ui/skeleton";

export function PlayerCardSkeleton() {
  return (
    <div className="group relative">
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-md dark:bg-gray-800">
        {/* Avatar section skeleton */}
        <div className="relative aspect-square bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
          <Skeleton className="h-full w-full" />

          {/* Games count badge skeleton */}
          <div className="absolute right-3 top-3 z-20">
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>

        {/* Info section skeleton */}
        <div className="p-4">
          <Skeleton className="h-5 w-3/4" />
        </div>
      </div>
    </div>
  );
}
