"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** Minimum interval between syncs (1 hour in ms) */
const SYNC_COOLDOWN_MS = 60 * 60 * 1000;

/**
 * Delay before refreshing the page data after sync is initiated (in ms).
 * The sync endpoint returns 202 immediately while processing continues
 * in the background — we wait a bit for the DB to be updated.
 */
const REFRESH_DELAY_MS = 4_000;

/**
 * Triggers a background sync with IGDB when visiting a game page.
 * After the sync is initiated, waits briefly then refreshes the page data
 * so the user sees the updated information without a manual reload.
 *
 * Skips sync if the game was synced recently (within SYNC_COOLDOWN_MS).
 */
export function useBackgroundSync(slug: string, igdbId?: number, lastSyncedAt?: string): void {
  const hasFired = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (hasFired.current) return;
    if (!igdbId) return;

    // Skip if synced recently
    if (lastSyncedAt) {
      const elapsed = Date.now() - new Date(lastSyncedAt).getTime();
      if (elapsed < SYNC_COOLDOWN_MS) return;
    }

    hasFired.current = true;

    fetch(`/api/games/${slug}/sync`, { method: "POST" })
      .then((res) => {
        if (res.ok) {
          // The sync endpoint returns 202 immediately while processing
          // continues in the background. Wait a bit then refresh the
          // server-rendered data so the user sees updated IGDB info.
          setTimeout(() => {
            router.refresh();
          }, REFRESH_DELAY_MS);
        }
      })
      .catch(() => {
        // Sync silencieux — les erreurs sont gérées côté serveur
      });
  }, [slug, igdbId, lastSyncedAt, router]);
}
