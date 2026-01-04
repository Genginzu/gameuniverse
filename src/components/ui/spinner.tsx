import * as React from "react";
import { cn } from "@/lib/utils";
import { GameUniverseLogo } from "./game-universe-logo";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "md", ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex items-center justify-center", className)} {...props}>
        <GameUniverseLogo size={size} animate />
      </div>
    );
  }
);
Spinner.displayName = "Spinner";

export { Spinner };
