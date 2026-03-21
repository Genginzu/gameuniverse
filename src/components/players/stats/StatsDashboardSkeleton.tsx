import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton fidèle au layout réel du StatsDashboard :
 * overview cards → 2 charts → completion → sections pleine largeur.
 */
export function StatsDashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Overview cards — 6 cards in 2x3 grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card flex animate-pulse items-center gap-3 rounded-xl p-4">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-gray-200 dark:bg-slate-700" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-20 bg-gray-200 dark:bg-slate-700" />
              <Skeleton className="h-6 w-14 bg-gray-200 dark:bg-slate-700" />
            </div>
          </div>
        ))}
      </div>

      {/* Genre + Platform charts — 2 columns */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-5 w-40 bg-gray-200 dark:bg-slate-700" />
            <div className="glass-card animate-pulse rounded-xl p-6">
              <div className="flex flex-col items-center gap-4 md:flex-row">
                {/* Pie chart placeholder */}
                <div className="h-48 w-48 rounded-full bg-gray-200 dark:bg-slate-700" />
                {/* Legend */}
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-gray-200 dark:bg-slate-700" />
                      <Skeleton className="h-3.5 w-24 bg-gray-200 dark:bg-slate-700" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Completion tracker */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-36 bg-gray-200 dark:bg-slate-700" />
        <div className="glass-card animate-pulse space-y-4 rounded-xl p-6">
          <div className="flex items-baseline gap-2">
            <Skeleton className="h-8 w-16 bg-gray-200 dark:bg-slate-700" />
            <Skeleton className="h-3.5 w-20 bg-gray-200 dark:bg-slate-700" />
          </div>
          <Skeleton className="h-4 w-full rounded-full bg-gray-200 dark:bg-slate-700" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-200 dark:bg-slate-700" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16 bg-gray-200 dark:bg-slate-700" />
                  <Skeleton className="h-5 w-8 bg-gray-200 dark:bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full-width sections: review analytics, social, timeline, playtime, sessions, goals */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-5 w-44 bg-gray-200 dark:bg-slate-700" />
          <div className="glass-card animate-pulse space-y-3 rounded-xl p-6">
            <Skeleton className="h-4 w-3/4 bg-gray-200 dark:bg-slate-700" />
            <Skeleton className="h-4 w-1/2 bg-gray-200 dark:bg-slate-700" />
            <Skeleton className="h-32 w-full rounded-lg bg-gray-200 dark:bg-slate-700" />
          </div>
        </div>
      ))}
    </div>
  );
}
