import { Skeleton } from "@/components/ui/skeleton";

// Configuration for EntitySkeleton
export interface EntitySkeletonConfig {
  aspectRatio: "3:4" | "1:1";
  showBadge?: boolean;
  badgePosition?: "top-left" | "top-right";
  badgeSize?: "small" | "medium" | "large";
  showInfoSection?: boolean;
  infoLines?: number;
  // For player-style cards with gradient background
  useGradientBackground?: boolean;
}

export interface EntitySkeletonProps {
  config: EntitySkeletonConfig;
  className?: string;
}

// Preset configurations for different entity types
export const gameSkeletonConfig: EntitySkeletonConfig = {
  aspectRatio: "3:4",
  showBadge: true,
  badgePosition: "top-right",
  badgeSize: "small", // 8x8 circle for metascore
  showInfoSection: false,
};

export const playerSkeletonConfig: EntitySkeletonConfig = {
  aspectRatio: "1:1",
  showBadge: true,
  badgePosition: "top-right",
  badgeSize: "medium", // Wider badge for "X games"
  showInfoSection: true,
  infoLines: 1,
  useGradientBackground: true,
};

export const characterSkeletonConfig: EntitySkeletonConfig = {
  aspectRatio: "3:4",
  showBadge: true,
  badgePosition: "top-right",
  badgeSize: "large", // Wider badge for role text
  showInfoSection: false,
};

// Get badge size classes based on configuration
function getBadgeSizeClasses(size?: "small" | "medium" | "large"): string {
  switch (size) {
    case "small":
      return "h-8 w-8 rounded-full"; // Metascore circle
    case "medium":
      return "h-6 w-16 rounded-full"; // Games count badge
    case "large":
      return "h-7 w-20 rounded-full"; // Role badge
    default:
      return "h-8 w-8 rounded-full";
  }
}

export function EntitySkeleton({ config, className = "" }: EntitySkeletonProps) {
  const aspectRatioClass = config.aspectRatio === "3:4" ? "aspect-3/4" : "aspect-square";
  const badgePositionClass = config.badgePosition === "top-left" ? "left-3" : "right-3";
  const badgeSizeClasses = getBadgeSizeClasses(config.badgeSize);

  // For player-style cards with info section below
  if (config.showInfoSection) {
    return (
      <div className={`group relative ${className}`}>
        <div className="border-editorial-line bg-editorial-2 relative overflow-hidden rounded-2xl border">
          {/* Image section */}
          <div
            className={`relative ${aspectRatioClass} ${
              config.useGradientBackground ? "bg-white/[0.04]" : ""
            }`}
          >
            <Skeleton className="h-full w-full bg-white/10" />

            {/* Badge skeleton */}
            {config.showBadge && (
              <div className={`absolute ${badgePositionClass} top-3 z-20`}>
                <Skeleton className={`${badgeSizeClasses} bg-white/10`} />
              </div>
            )}
          </div>

          {/* Info section skeleton */}
          <div className="p-4">
            {Array.from({ length: config.infoLines || 1 }).map((_, index) => (
              <Skeleton
                key={index}
                className={`h-5 bg-white/10 ${index === 0 ? "w-3/4" : "w-1/2"} ${index > 0 ? "mt-2" : ""}`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Standard card skeleton (games, characters)
  return (
    <div className={`group relative ${className}`}>
      <div
        className={`border-editorial-line bg-editorial-2 relative ${aspectRatioClass} overflow-hidden rounded-2xl border`}
      >
        {/* Cover Image Skeleton */}
        <Skeleton className="h-full w-full rounded-2xl bg-white/10" />

        {/* Badge skeleton */}
        {config.showBadge && (
          <div className={`absolute ${badgePositionClass} top-3 z-20`}>
            <Skeleton className={`${badgeSizeClasses} bg-white/10`} />
          </div>
        )}
      </div>
    </div>
  );
}

export default EntitySkeleton;
