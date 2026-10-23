"use client";

import { createContext, useContext } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBatchStatusSeed } from "@/hooks/useBatchStatusSeed";
import { favoriteStatusKey } from "@/lib/swr/keys";
import type { FavoriteStatusResponse } from "@/types/character";

interface CharacterFavoriteStatusContextValue {
  /** True while the batch request that will seed this character's status is running. */
  isSeeding: (slug: string) => boolean;
}

const CharacterFavoriteStatusContext = createContext<CharacterFavoriteStatusContextValue>({
  isSeeding: () => false,
});

export function useCharacterFavoriteStatus() {
  return useContext(CharacterFavoriteStatusContext);
}

const toFavoriteStatus = (isFavorite: boolean): FavoriteStatusResponse => ({ isFavorite });

interface CharacterFavoriteStatusProviderProps {
  slugs: string[];
  children: React.ReactNode;
}

/** Seeds the per-character favorite status SWR keys with one batch request. */
export function CharacterFavoriteStatusProvider({
  slugs,
  children,
}: CharacterFavoriteStatusProviderProps) {
  const { user } = useAuth();
  const isSeeding = useBatchStatusSeed({
    ids: slugs,
    enabled: !!user,
    url: "/api/favorites/characters/batch-status",
    bodyField: "slugs",
    keyFor: favoriteStatusKey,
    toData: toFavoriteStatus,
  });

  return (
    <CharacterFavoriteStatusContext.Provider value={{ isSeeding }}>
      {children}
    </CharacterFavoriteStatusContext.Provider>
  );
}
