import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function GameDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Back button skeleton */}
        <div className="mb-6">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left column - Game cover and basic info */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden bg-white shadow-lg">
              <CardContent className="p-0">
                {/* Cover image skeleton */}
                <Skeleton className="aspect-[3/4] w-full" />

                <div className="p-6">
                  {/* Title skeleton */}
                  <Skeleton className="mb-3 h-8 w-full" />

                  {/* Developer/Publisher skeleton */}
                  <div className="mb-4 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-28" />
                  </div>

                  {/* Genres skeleton */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-6 w-16 rounded-full" />
                    ))}
                  </div>

                  {/* Metascore skeleton */}
                  <div className="mb-4 flex items-center space-x-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>

                  {/* Price skeleton */}
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Detailed information */}
          <div className="lg:col-span-2">
            <div className="space-y-8">
              {/* Description section */}
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>

              {/* Game details section */}
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div key={index}>
                        <Skeleton className="mb-2 h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Media gallery section */}
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Skeleton key={index} className="aspect-video w-full rounded-lg" />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System requirements section */}
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <div key={index}>
                        <Skeleton className="mb-4 h-5 w-32" />
                        <div className="space-y-2">
                          {Array.from({ length: 5 }).map((_, reqIndex) => (
                            <div key={reqIndex} className="flex justify-between">
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-4 w-32" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
