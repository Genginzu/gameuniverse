import { Skeleton } from "@/components/ui/skeleton";

export function GameCardSkeleton() {
  return (
    <div className="group relative">
      <div className="relative aspect-3/4 overflow-hidden rounded-2xl bg-white shadow-md dark:bg-gray-800">
        {/* Cover Image Skeleton */}
        <Skeleton className="h-full w-full rounded-2xl" />

        {/* Metascore badge skeleton */}
        <div className="absolute right-3 top-3 z-20">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}
