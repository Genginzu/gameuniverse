import { Skeleton } from "@/components/ui/skeleton";

/**
 * Next.js loading state for the discussions page.
 */
export default function DiscussionsLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Title */}
      <Skeleton className="h-8 w-48" />

      {/* Discussion threads */}
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3 rounded-xl border border-gray-200/50 p-4 dark:border-slate-700/50">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
