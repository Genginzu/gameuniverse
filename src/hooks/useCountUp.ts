"use client";

import { useEffect, useState } from "react";

/**
 * Animates a counter from 0 to `target` once `isVisible` becomes true.
 * Jumps straight to the target when `prefers-reduced-motion: reduce` is set.
 */
export function useCountUp(target: number, isVisible: boolean, duration = 1800): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setCount(target);
      return;
    }

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isVisible, target, duration]);

  return count;
}
