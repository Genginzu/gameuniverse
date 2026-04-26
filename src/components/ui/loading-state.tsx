import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface LoadingStateProps {
  type?: "spinner" | "skeleton" | "pulse";
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
}

/**
 * Spinner with ping animation — shared pattern used by LoadingState and PageLoading.
 */
export function SpinnerWithPing({
  size = "md",
  message,
}: {
  size?: "sm" | "md" | "lg";
  message?: string;
}) {
  return (
    <div className="text-center">
      <div className="relative mb-4 inline-block">
        <LoadingSpinner size={size} />
        <div className="bg-palette-primary-500 absolute inset-0 animate-ping rounded-full opacity-20"></div>
      </div>
      {message && <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>}
    </div>
  );
}

export function LoadingState({
  type = "spinner",
  size = "md",
  message,
  className = "",
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "py-8",
    md: "py-12",
    lg: "py-16 sm:py-20",
  };

  if (type === "skeleton") {
    return (
      <div className={`space-y-4 ${className}`}>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (type === "pulse") {
    return (
      <div
        className={`flex flex-col items-center justify-center ${sizeClasses[size]} ${className}`}
      >
        <div className="relative">
          <div className="bg-palette-secondary-500/30 h-12 w-12 animate-pulse rounded-full"></div>
          <div className="bg-palette-primary-500 absolute inset-0 animate-ping rounded-full opacity-20"></div>
        </div>
        {message && <p className="mt-4 text-sm text-gray-500">{message}</p>}
      </div>
    );
  }

  // Spinner mode uses shared SpinnerWithPing
  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <SpinnerWithPing size={size} message={message} />
    </div>
  );
}
