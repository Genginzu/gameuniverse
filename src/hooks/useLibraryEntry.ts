"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { useLibraryToggle } from "./useLibraryToggle";
import { useLibraryStatusChange } from "./useLibraryStatusChange";
import { useLibraryStatus } from "@/components/providers/LibraryStatusProvider";
import { libraryStatusKey } from "@/lib/swr/keys";
import type { LibraryStatus, LibraryStatusResponse } from "@/types/library";

// The status may be seeded by LibraryStatusProvider and is revalidated after
// every mutation, so a cached value is never refetched on mount or focus.
const STATUS_OPTIONS = { revalidateIfStale: false, revalidateOnFocus: false };

async function succeeded(mutation: Promise<unknown>): Promise<boolean> {
  try {
    return (await mutation) !== undefined;
  } catch {
    return false;
  }
}

/**
 * Library entry of one game for a signed-in player: in library or not, its
 * status, and optimistic add / remove / status change. Actions return false
 * when the request fails (rolled back) or a mutation of this game is in flight.
 * The caller tells whether a player is signed in (auth hook or provider).
 */
export function useLibraryEntry(gameId: string, signedIn: boolean) {
  const { isSeeding } = useLibraryStatus();
  const seeding = !!gameId && isSeeding(gameId);
  const { trigger: toggle, isPending: toggling } = useLibraryToggle();
  const { trigger: changeStatus, isPending: changing } = useLibraryStatusChange();
  const enabled = signedIn && !!gameId;

  const { data, isLoading } = useSWR<LibraryStatusResponse>(
    enabled && !seeding ? libraryStatusKey(gameId) : null,
    STATUS_OPTIONS
  );

  const setInLibrary = useCallback(
    async (inLibrary: boolean, status?: LibraryStatus) =>
      enabled && succeeded(toggle({ gameId, inLibrary, status })),
    [enabled, gameId, toggle]
  );

  const setStatus = useCallback(
    async (status: LibraryStatus) => enabled && succeeded(changeStatus({ gameId, status })),
    [enabled, gameId, changeStatus]
  );

  const addToLibrary = useCallback(() => setInLibrary(true), [setInLibrary]);
  const addToWishlist = useCallback(() => setInLibrary(true, "wishlist"), [setInLibrary]);
  const removeFromLibrary = useCallback(() => setInLibrary(false), [setInLibrary]);

  return {
    inLibrary: data?.inLibrary ?? false,
    status: data?.inLibrary ? data.status : undefined,
    loading: seeding || isLoading,
    adding: toggling || changing,
    addToLibrary,
    addToWishlist,
    removeFromLibrary,
    setStatus,
  };
}
