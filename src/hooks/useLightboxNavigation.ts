"use client";

import { useCallback, useEffect, useRef, type TouchEvent } from "react";

const SWIPE_THRESHOLD_PX = 50;

interface LightboxNavigationOptions {
  open: boolean;
  index: number;
  count: number;
  onIndexChange: (index: number) => void;
}

/**
 * Wrap-around previous/next navigation for a lightbox: ArrowLeft/ArrowRight
 * on the window while open, plus horizontal swipe handlers for touch screens.
 */
export function useLightboxNavigation({ open, index, count, onIndexChange }: LightboxNavigationOptions) {
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback(
    (offset: number) => {
      if (count === 0) return;
      onIndexChange((index + offset + count) % count);
    },
    [index, count, onIndexChange]
  );
  const previous = useCallback(() => goTo(-1), [goTo]);
  const next = useCallback(() => goTo(1), [goTo]);

  useEffect(() => {
    if (!open || count < 2) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") previous();
      if (event.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, count, previous, next]);

  const onTouchStart = useCallback((event: TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }, []);

  const onTouchEnd = useCallback(
    (event: TouchEvent) => {
      const startX = touchStartX.current;
      touchStartX.current = null;
      const endX = event.changedTouches[0]?.clientX;
      if (startX === null || endX === undefined || count < 2) return;
      const delta = endX - startX;
      if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
      if (delta > 0) previous();
      else next();
    },
    [count, previous, next]
  );

  return { previous, next, swipeHandlers: { onTouchStart, onTouchEnd } };
}
