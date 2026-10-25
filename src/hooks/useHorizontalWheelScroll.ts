"use client";

import { useEffect, useState } from "react";

import { resolveHorizontalWheel } from "@/lib/utils/horizontalWheel";

/**
 * While the pointer is over the element, the vertical mouse wheel scrolls it
 * horizontally. Once an edge is reached (or the pointer leaves), the wheel
 * scrolls the page again.
 *
 * Returns a callback ref so the listener follows the element even when it is
 * mounted later (e.g. after a loading skeleton). Uses a native non-passive
 * listener: React's `onWheel` is passive and cannot call `preventDefault()`.
 */
export function useHorizontalWheelScroll<T extends HTMLElement>(): (node: T | null) => void {
  const [element, setElement] = useState<T | null>(null);

  useEffect(() => {
    if (!element) return;

    const handleWheel = (event: WheelEvent) => {
      const delta = resolveHorizontalWheel({
        deltaX: event.deltaX,
        deltaY: event.deltaY,
        deltaMode: event.deltaMode,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        scrollLeft: element.scrollLeft,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      });
      if (delta === null) return;

      event.preventDefault();
      element.scrollLeft += delta;
    };

    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, [element]);

  return setElement;
}
