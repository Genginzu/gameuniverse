import { Skeleton } from "@/components/ui/skeleton";

/**
 * Next.js loading state for the discussions page.
 */
export default function DiscussionsLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <Skeleton className="h-8 w-48 bg-white/10" />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4 bg-white/10" />
              <Skeleton className="h-4 w-full bg-white/10" />
              <Skeleton className="h-3 w-32 bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
