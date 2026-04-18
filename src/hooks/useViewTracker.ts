"use client";

import { useEffect, useRef } from "react";

type EntityType = "games" | "characters";

/**
 * Tracks a page view by sending a POST to /api/{entityType}/{slug}/views.
 * Fires once per mount (strict mode safe via ref guard).
 */
export function useViewTracker(entityType: EntityType, slug: string) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    fetch(`/api/${entityType}/${slug}/views`, { method: "POST" }).catch(() => {
      // Silent fail — view tracking is non-critical
    });
  }, [entityType, slug]);
}
