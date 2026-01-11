import { Skeleton } from "@/components/ui/skeleton";

export function MediaGallerySkeleton() {
  return (
    <div className="space-y-8">
      {/* Screenshots section */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div>
          {/* Main image skeleton */}
          <div className="relative mb-6 aspect-video overflow-hidden rounded-xl">
            <Skeleton className="h-full w-full" />
          </div>

          {/* Thumbnails skeleton */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-32 flex-shrink-0 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Artwork section */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-24" />
        <div>
          {/* Main image skeleton */}
          <div className="relative mb-6 aspect-video overflow-hidden rounded-xl">
            <Skeleton className="h-full w-full" />
          </div>

          {/* Thumbnails skeleton */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-32 flex-shrink-0 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Videos section */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-20" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
