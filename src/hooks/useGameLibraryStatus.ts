"use client";

import { useAuth } from "./useAuth";
import { useLibraryEntry } from "./useLibraryEntry";

/**
 * Library status of one game for the signed-in user, with optimistic add /
 * remove / status change (see `useLibraryEntry`).
 */
export function useGameLibraryStatus(gameId: string) {
  const { user } = useAuth();
  return useLibraryEntry(gameId, !!user);
}
