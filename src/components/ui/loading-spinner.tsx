"use client";

import { GameUniverseLogo } from "./game-universe-logo";
import { cn } from "@/lib/utils";
import { LoadingSpinnerConfig } from "@/types/ui";

interface LoadingSpinnerProps extends LoadingSpinnerConfig {
  showText?: boolean;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  text,
  showText = false,
  className,
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <GameUniverseLogo size={size} animate />
      {showText && text && (
        <p
          className={cn(
            "font-medium text-gray-600",
            size === "sm" && "text-sm",
            size === "md" && "text-base",
            size === "lg" && "text-lg",
            size === "xl" && "text-xl"
          )}
        >
          {text}
        </p>
      )}
    </div>
  );
}
