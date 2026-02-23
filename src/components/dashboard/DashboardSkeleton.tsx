import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex-1 p-4 sm:p-6">
      {/* Page Header Skeleton */}
      <div className="mb-6 sm:mb-8">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="glass-card rounded-2xl p-5">
            <div className="mb-3 flex items-center">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="ml-3 flex-1">
                <Skeleton className="mb-1 h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="mb-1 h-8 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass-card rounded-2xl p-6 lg:col-span-2">
          <Skeleton className="mb-2 h-6 w-32" />
          <Skeleton className="mb-4 h-4 w-48" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <Skeleton className="mb-2 h-6 w-32" />
          <Skeleton className="mb-4 h-4 w-40" />
          <div className="space-y-4">
            <div>
              <Skeleton className="mb-1 h-4 w-16" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div>
              <Skeleton className="mb-1 h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
