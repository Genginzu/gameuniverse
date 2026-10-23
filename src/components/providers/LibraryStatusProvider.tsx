"use client";

import { createContext, useContext } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBatchStatusSeed } from "@/hooks/useBatchStatusSeed";
import { libraryStatusKey } from "@/lib/swr/keys";
import type { LibraryStatusResponse } from "@/types/library";

interface LibraryStatusContextValue {
  /** True while the batch request that will seed this game's status is running. */
  isSeeding: (gameId: string) => boolean;
}

const LibraryStatusContext = createContext<LibraryStatusContextValue>({
  isSeeding: () => false,
});

export function useLibraryStatus() {
  return useContext(LibraryStatusContext);
}

const toLibraryStatus = (inLibrary: boolean): LibraryStatusResponse => ({ inLibrary });

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
    <LibraryStatusContext.Provider value={{ isSeeding }}>{children}</LibraryStatusContext.Provider>
  );
}
