"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { useAuth } from "./useAuth";
import { useLibraryToggle } from "./useLibraryToggle";
import { useLibraryStatus } from "@/components/providers/LibraryStatusProvider";
import { libraryStatusKey } from "@/lib/swr/keys";
import type { LibraryStatusResponse } from "@/types/library";

// The status may be seeded by LibraryStatusProvider and is revalidated after
// every toggle, so a cached value is never refetched on mount or focus.
const STATUS_OPTIONS = { revalidateIfStale: false, revalidateOnFocus: false };

/**
 * Library status of one game with optimistic add/remove.
 * Returns false when the request fails (the status is rolled back) or when a
 * toggle of this game is already in flight.
 */
export function useGameLibraryStatus(gameId: string) {
  const { user } = useAuth();
  const { isSeeding } = useLibraryStatus();
  const seeding = !!gameId && isSeeding(gameId);
  const { trigger, isPending } = useLibraryToggle();

  const { data, isLoading } = useSWR<LibraryStatusResponse>(
    user && gameId && !seeding ? libraryStatusKey(gameId) : null,
    STATUS_OPTIONS
  );

  const setInLibrary = useCallback(
    async (inLibrary: boolean) => {
      if (!user || !gameId) return false;
      try {
        return (await trigger({ gameId, inLibrary })) !== undefined;
      } catch {
        return false;
      }
    },
    [user, gameId, trigger]
  );

  const addToLibrary = useCallback(() => setInLibrary(true), [setInLibrary]);
  const removeFromLibrary = useCallback(() => setInLibrary(false), [setInLibrary]);

  return {
    inLibrary: data?.inLibrary ?? false,
    loading: seeding || isLoading,
    adding: isPending,
    addToLibrary,
    removeFromLibrary,
  };
}
