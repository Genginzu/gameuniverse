"use client";

import { createContext, useContext } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBatchStatusSeed } from "@/hooks/useBatchStatusSeed";
import { libraryStatusKey } from "@/lib/swr/keys";
import type { LibraryStatus, LibraryStatusResponse } from "@/types/library";

interface LibraryStatusContextValue {
  /** True while the batch request that will seed this game's status is running. */
  isSeeding: (gameId: string) => boolean;
  /**
   * True inside a provider once a user is signed in. Game cards only offer the
   * quick "add to library" button there, so statuses are always batch-seeded.
   */
  signedIn: boolean;
}

const LibraryStatusContext = createContext<LibraryStatusContextValue>({
  isSeeding: () => false,
  signedIn: false,
});

export function useLibraryStatus() {
  return useContext(LibraryStatusContext);
}

function toLibraryStatus(
  inLibrary: boolean,
  gameId: string,
  body: Record<string, unknown>
): LibraryStatusResponse {
  if (!inLibrary) return { inLibrary };
  const statuses = body.libraryStatuses as Record<string, LibraryStatus> | undefined;
  return { inLibrary, status: statuses?.[gameId] };
}

interface LibraryStatusProviderProps {
  gameIds: string[];
  children: React.ReactNode;
}

/** Seeds the per-game library status SWR keys with one batch request. */
export function LibraryStatusProvider({ gameIds, children }: LibraryStatusProviderProps) {
  const { user } = useAuth();
  const isSeeding = useBatchStatusSeed({
    ids: gameIds,
    enabled: !!user,
    url: "/api/library/batch-status",
    bodyField: "gameIds",
    keyFor: libraryStatusKey,
    toData: toLibraryStatus,
  });

  return (
    <LibraryStatusContext.Provider value={{ isSeeding, signedIn: !!user }}>
      {children}
    </LibraryStatusContext.Provider>
  );
}
