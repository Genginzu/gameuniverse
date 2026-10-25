"use client";

import { useOptimisticMutation } from "./useOptimisticMutation";
import { jsonRequest } from "@/lib/utils/json-request";
import { affect } from "@/lib/swr/optimistic";
import { LIBRARY_RELATED_KEYS, libraryStatusKey } from "@/lib/swr/keys";
import { libraryStatusUpdater } from "@/lib/swr/updaters/library";
import { toLibraryStatus } from "@/lib/validations/library";
import type { LibraryStatusResponse } from "@/types/library";

export interface LibraryToggleArgs {
  gameId: string;
  inLibrary: boolean;
  /** Initial library status when adding (server default otherwise). */
  status?: string;
}

function requestLibraryToggle({ gameId, inLibrary, status }: LibraryToggleArgs) {
  if (!inLibrary) return jsonRequest(libraryStatusKey(gameId), "DELETE");
  return jsonRequest("/api/library", "POST", status ? { gameId, status } : { gameId });
}

/** Optimistic add/remove of a game in the user's library; one in-flight toggle per game. */
export function useLibraryToggle() {
  return useOptimisticMutation<LibraryToggleArgs>({
    request: requestLibraryToggle,
    affects: ({ gameId, inLibrary, status }) => [
      affect<LibraryStatusResponse>(
        libraryStatusKey(gameId),
        libraryStatusUpdater(inLibrary, toLibraryStatus(status))
      ),
    ],
    related: () => LIBRARY_RELATED_KEYS,
    dedupeId: ({ gameId }) => `library:${gameId}`,
  });
}
