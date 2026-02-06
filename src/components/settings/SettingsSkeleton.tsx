import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function SettingsSkeleton() {
  return (
    <div className="flex-1 p-4 sm:p-6">
      {/* Page Header Skeleton */}
      <div className="mb-6 sm:mb-8">
        <Skeleton className="mb-2 h-8 w-32" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Settings Sections Skeleton */}
      <div className="space-y-6">
        {/* Profile Section Skeleton */}
        <Card className="rounded-xl bg-white dark:bg-gray-800">
          <CardHeader>
            <div className="flex items-center">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <div className="ml-3 flex-1">
                <Skeleton className="mb-1 h-5 w-24" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Skeleton className="mb-2 h-4 w-32" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div>
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </CardContent>
        </Card>

        {/* Security Section Skeleton */}
        <Card className="rounded-xl bg-white dark:bg-gray-800">
          <CardHeader>
            <div className="flex items-center">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <div className="ml-3 flex-1">
                <Skeleton className="mb-1 h-5 w-20" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div>
              <Skeleton className="mb-2 h-4 w-28" />
              <Skeleton className="mb-4 h-4 w-72" />
              <Skeleton className="h-10 w-48 rounded-md" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
