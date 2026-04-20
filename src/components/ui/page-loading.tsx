import { Skeleton } from "@/components/ui/skeleton";
import { SpinnerWithPing } from "@/components/ui/loading-state";

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-xl dark:bg-slate-800/80">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent"></div>
          {message && <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>}
        </div>
      </div>
    );
  }

  if (type === "skeleton") {
    return (
      <div className="min-h-screen bg-white/40 p-4 backdrop-blur-xl dark:bg-slate-800/50">
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
                <div key={index} className="rounded-lg bg-white/40 p-6 shadow-xs dark:bg-slate-800/50">
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
                <div key={index} className="rounded-lg bg-white/40 p-6 shadow-xs dark:bg-slate-800/50">
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

  // Default spinner type — uses shared SpinnerWithPing
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-xl dark:bg-slate-800/90">
      <div className="text-center">
        <SpinnerWithPing size="lg" message={message} />

        {showProgress && (
          <div className="mx-auto w-64">
            <div className="mb-2 h-2 rounded-full bg-white/30 dark:bg-slate-700/50">
              <div
                className="h-2 rounded-full bg-linear-to-r from-cyan-500 to-violet-500 transition-all duration-300 ease-out"
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
