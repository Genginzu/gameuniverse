import { Skeleton } from "@/components/ui/skeleton";

/**
 * Next.js loading state for the games page.
 */
export default function GamesLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Title + search */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>
      <Skeleton className="h-10 w-full rounded-md" />

      {/* Games grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
