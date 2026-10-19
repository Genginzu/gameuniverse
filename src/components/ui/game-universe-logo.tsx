"use client";

import { cn } from "@/lib/utils";
import { GameUniverseLogoConfig } from "@/types/ui";

interface GameUniverseLogoProps extends GameUniverseLogoConfig {
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

export function GameUniverseLogo({
  size = "md",
  animate = false,
  className,
}: GameUniverseLogoProps) {
  return (
    <div
      className={cn(
        "from-palette-primary-500 via-palette-accent-600 to-palette-accent-700 relative flex items-center justify-center rounded-2xl bg-linear-to-br shadow-lg",
        sizeClasses[size],
        animate && "animate-spin",
        className
      )}
    >
      <span
        className={cn(
          "font-bold text-white select-none",
          size === "sm" && "text-sm",
          size === "md" && "text-lg",
          size === "lg" && "text-2xl",
          size === "xl" && "text-4xl"
        )}
      >
        G
      </span>
    </div>
  );
}
