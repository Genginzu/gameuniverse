import { useState, useEffect, type RefObject } from "react";

interface UseInViewOptions {
  threshold?: number;
  /** Only trigger once (default: true) */
  once?: boolean;
}

/**
 * Returns true when the referenced element enters the viewport.
 * Uses IntersectionObserver for performance.
 */
export function useInView(
  ref: RefObject<HTMLElement | null>,
  options: UseInViewOptions = {}
): boolean {
  const { threshold = 0.1, once = true } = options;
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) observer.unobserve(element);
        } else if (!once) {
          setIsInView(false);
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, threshold, once]);

  return isInView;
}
