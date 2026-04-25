"use client";

import { Skeleton } from "@/components/ui/skeleton";

/** Generic skeleton for tabs without a dedicated one */
export function TabSkeleton() {
  return (
    <div className="space-y-4">
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

/** Skeleton for recommendations (game card grid) */
export function RecommendationsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="aspect-3/4 w-full rounded-2xl" />
      ))}
    </div>
  );
}

/** Skeleton for friends (card grid) */
export function FriendsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl bg-gray-200 dark:bg-slate-700/50" />
      ))}
    </div>
  );
}
