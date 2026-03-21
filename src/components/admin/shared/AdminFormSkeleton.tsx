import { Skeleton } from "@/components/ui/skeleton";

interface AdminFormSkeletonProps {
  showHeroBanner?: boolean;
  tabs?: number;
  fields?: number;
}

/**
 * Skeleton placeholder for admin form pages (edit/new).
 * Mimics the hero banner + tab navigation + form fields layout.
 */
export function AdminFormSkeleton({
  showHeroBanner = true,
  tabs = 6,
  fields = 5,
}: AdminFormSkeletonProps) {
  return (
    <div className="space-y-5 p-4 lg:p-6">
      {/* Back button */}
      <Skeleton className="h-8 w-32 rounded-md" />

      {/* Hero banner skeleton */}
      {showHeroBanner && (
        <div className="flex gap-6 rounded-2xl border border-gray-200/60 bg-gray-900/80 p-6 dark:border-gray-700/40">
          <Skeleton className="h-44 w-32 shrink-0 rounded-xl bg-white/10" />
          <div className="flex flex-1 flex-col justify-end gap-2 pb-1">
            <Skeleton className="h-7 w-64 bg-white/10" />
            <Skeleton className="h-4 w-40 bg-white/10" />
            <div className="mt-2 flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full bg-white/10" />
              <Skeleton className="h-5 w-20 rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      )}

      {/* Tab navigation skeleton */}
      <div className="flex gap-1 rounded-xl border border-gray-200/60 bg-white p-1 dark:border-gray-700/40 dark:bg-gray-800/60">
        {Array.from({ length: tabs }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-10 rounded-lg"
            style={{ width: `${70 + ((i * 17) % 40)}px` }}
          />
        ))}
      </div>

      {/* Form content skeleton */}
      <div className="space-y-6 rounded-2xl border border-gray-200/60 bg-white p-6 dark:border-gray-700/40 dark:bg-gray-800/60">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
