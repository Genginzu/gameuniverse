"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Minimum interval between syncs (24 hours in ms).
 *
 * IGDB data rarely changes more than once a day for a given game.
 * 24h strikes a good balance between freshness and API rate-limit
 * conservation (Twitch free tier: 4 req/s).
 */
const SYNC_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/**
 * Delay before refreshing the page data after sync is initiated (in ms).
 * The sync endpoint returns 202 immediately while processing continues
 * in the background — we wait a bit for the DB to be updated.
 */
const REFRESH_DELAY_MS = 12_000;

/**
 * Triggers a background sync with IGDB when visiting a game page.
 *
 * Strategy: stale-while-revalidate
 * 1. The page renders immediately with existing DB data (server-side).
 * 2. If the game hasn't been synced in the last 24 h, a background sync
 *    is fired (POST /api/games/:slug/sync → 202 Accepted).
 * 3. After a short delay the page data is refreshed via router.refresh()
 *    so the user sees updated info without a manual reload.
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
