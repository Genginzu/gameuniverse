"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { GridSkeleton } from "@/components/shared/GridSkeleton";
import { gameSkeletonConfig } from "@/components/shared/EntitySkeleton";

/** Skeleton fidèle au layout réel : stats cards + search bar + grille */
export function LibraryPageSkeleton() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Stats Cards Skeleton — 4 cartes identiques au layout réel */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="rounded-2xl bg-white dark:bg-gray-800">
              <CardHeader className="pb-3">
                <div className="flex items-center">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="ml-3">
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="mb-1 h-7 w-14" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search bar + filter button skeleton */}
        <div className="mb-6 space-y-4 sm:mb-8">
          <div className="flex flex-col gap-4 sm:flex-row">
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 w-12 shrink-0 rounded-xl sm:w-28" />
          </div>
        </div>

        {/* Game cards grid skeleton */}
        <GridSkeleton skeletonConfig={gameSkeletonConfig} count={20} />
      </div>
    </div>
  );
}
