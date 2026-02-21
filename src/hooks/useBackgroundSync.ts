"use client";

import { useEffect, useRef } from "react";

/** Minimum interval between syncs (1 hour in ms) */
const SYNC_COOLDOWN_MS = 60 * 60 * 1000;

/**
 * Triggers a fire-and-forget background sync with IGDB when visiting a game page.
 * Skips sync if the game was synced recently (within SYNC_COOLDOWN_MS).
 */
export function useBackgroundSync(slug: string, igdbId?: number, lastSyncedAt?: string): void {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    if (!igdbId) return;

    // Skip if synced recently
    if (lastSyncedAt) {
      const elapsed = Date.now() - new Date(lastSyncedAt).getTime();
      if (elapsed < SYNC_COOLDOWN_MS) return;
    }

    hasFired.current = true;

    fetch(`/api/games/${slug}/sync`, { method: "POST" }).catch((error) => {
      console.error("[useBackgroundSync] Sync error:", error);
    });
  }, [slug, igdbId, lastSyncedAt]);
}
