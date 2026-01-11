import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function LibrarySkeleton() {
  return (
    <div className="p-4 sm:p-6">
      {/* Page Header Skeleton */}
      <div className="mb-6 sm:mb-8">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="ml-3">
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-1 h-8 w-12" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <Card className="bg-white">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Skeleton className="mb-4 h-16 w-16 rounded-full sm:h-20 sm:w-20" />
          <Skeleton className="mb-2 h-6 w-48" />
          <Skeleton className="mb-6 h-4 w-80" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}
