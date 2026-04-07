import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Skeleton } from "@/components/ui/skeleton";

interface PageLoadingProps {
  type?: "spinner" | "skeleton" | "minimal";
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

export function PageLoading({
  type = "spinner",
  message,
  showProgress = false,
  progress = 0,
}: PageLoadingProps) {
  if (type === "minimal") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-xs dark:bg-gray-900/80">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          {message && <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>}
        </div>
      </div>
    );
  }

  if (type === "skeleton") {
    return (
      <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl">
          {/* Header skeleton */}
          <div className="mb-8">
            <Skeleton className="mb-2 h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Content skeleton */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-6 md:col-span-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-lg bg-white p-6 shadow-xs dark:bg-gray-800">
                  <Skeleton className="mb-4 h-6 w-32" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="rounded-lg bg-white p-6 shadow-xs dark:bg-gray-800">
                  <Skeleton className="mb-4 h-6 w-24" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default spinner type
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-xs dark:bg-gray-900/90">
      <div className="text-center">
        <div className="relative mb-6">
          <LoadingSpinner size="lg" />
          <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-20"></div>
        </div>

        {message && <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">{message}</h3>}

        {showProgress && (
          <div className="mx-auto w-64">
            <div className="mb-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">{Math.round(progress)}%</p>
          </div>
        )}
      </div>
    </div>
  );
}
