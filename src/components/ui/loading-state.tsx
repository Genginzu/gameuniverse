import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface LoadingStateProps {
  type?: "spinner" | "skeleton" | "pulse";
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
}

export function LoadingState({
  type = "spinner",
  size = "md",
  message = "Chargement...",
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
          <div className="h-12 w-12 animate-pulse rounded-full bg-blue-200"></div>
          <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-20"></div>
        </div>
        {message && <p className="mt-4 text-sm text-gray-500">{message}</p>}
      </div>
    );
  }

  // Default spinner type
  return (
    <div className={`flex flex-col items-center justify-center ${sizeClasses[size]} ${className}`}>
      <div className="relative">
        <LoadingSpinner size={size === "sm" ? "sm" : size === "lg" ? "lg" : "md"} />
        <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-20"></div>
      </div>
      {message && <p className="mt-4 text-sm text-gray-500">{message}</p>}
    </div>
  );
}
