import { Skeleton } from "@/components/ui/skeleton";

export function FiltersSkeleton() {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      {/* Clear filters button skeleton */}
      <div className="mb-4 flex justify-end">
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      {/* Genres section */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-16" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Publishers section */}
      <div className="mt-6 space-y-3">
        <Skeleton className="h-5 w-20" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
