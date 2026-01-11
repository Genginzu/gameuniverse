import { Skeleton } from "@/components/ui/skeleton";

export function SearchSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section Skeleton */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 py-8 text-white sm:px-6 sm:py-12">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative mx-auto max-w-4xl">
          <div className="text-center">
            <Skeleton className="mx-auto mb-3 h-12 w-80 bg-white/20" />
            <Skeleton className="mx-auto mb-4 h-6 w-96 bg-white/15" />
            <Skeleton className="mx-auto h-8 w-32 rounded-full bg-white/15" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Search and Filters Skeleton */}
        <div className="mb-6 space-y-4 sm:mb-8">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
            <div className="flex-shrink-0">
              <Skeleton className="h-12 w-32 rounded-lg" />
            </div>
          </div>

          {/* Filter content skeleton */}
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results info skeleton */}
        <div className="mb-4 flex flex-col items-start justify-between rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:mb-6 sm:flex-row sm:items-center">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="mt-2 h-4 w-24 sm:mt-0" />
        </div>

        {/* Loading spinner */}
        <div className="flex flex-col items-center justify-center py-16 sm:py-20">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-20"></div>
          </div>
          <Skeleton className="mt-4 h-4 w-32" />
        </div>
      </div>
    </div>
  );
}
