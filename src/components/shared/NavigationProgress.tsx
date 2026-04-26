"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Reset when navigation completes
    setIsLoading(false);
    setProgress(0);
  }, [pathname, searchParams]);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    const handleStart = () => {
      setIsLoading(true);
      setProgress(0);

      // Animate progress
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          // Slow down as we approach 90%
          const increment = Math.max(1, (90 - prev) / 10);
          return Math.min(90, prev + increment);
        });
      }, 100);
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (anchor) {
        const href = anchor.getAttribute("href");
        // Only trigger for internal navigation links
        if (href && href.startsWith("/") && !href.startsWith("//")) {
          handleStart();
        }
      }
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
      if (progressInterval) clearInterval(progressInterval);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 right-0 left-0 z-9999 h-1">
      <div
        className="from-palette-secondary-500 via-palette-primary-500 to-palette-secondary-400 h-full bg-linear-to-r transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
