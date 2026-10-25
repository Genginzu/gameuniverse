"use client";

import { useOptimisticMutation } from "./useOptimisticMutation";
import { jsonRequest } from "@/lib/utils/json-request";
import { affect } from "@/lib/swr/optimistic";
import { LIBRARY_RELATED_KEYS, libraryStatusKey } from "@/lib/swr/keys";
import { libraryStatusChangeUpdater } from "@/lib/swr/updaters/library";
import type { LibraryStatus, LibraryStatusResponse } from "@/types/library";

export interface LibraryStatusChangeArgs {
  gameId: string;
  status: LibraryStatus;
}

/**
 * Optimistic status change of a library game ("playing", "completed"…).
 * Shares the add/remove dedupe id: one in-flight library mutation per game.
 */
export function useLibraryStatusChange() {
  return useOptimisticMutation<LibraryStatusChangeArgs>({
    request: ({ gameId, status }) => jsonRequest(libraryStatusKey(gameId), "PATCH", { status }),
    affects: ({ gameId, status }) => [
      affect<LibraryStatusResponse>(libraryStatusKey(gameId), libraryStatusChangeUpdater(status)),
    ],
    related: () => LIBRARY_RELATED_KEYS,
    dedupeId: ({ gameId }) => `library:${gameId}`,
  });
}
