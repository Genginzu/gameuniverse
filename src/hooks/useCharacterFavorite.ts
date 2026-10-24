"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useAuth } from "./useAuth";
import { useOptimisticMutation } from "./useOptimisticMutation";
import { useCharacterFavoriteStatus } from "@/components/providers/CharacterFavoriteStatusProvider";
import { jsonRequest } from "@/lib/utils/json-request";
import { affect } from "@/lib/swr/optimistic";
import { FAVORITE_RELATED_KEYS, favoriteCountKey, favoriteStatusKey } from "@/lib/swr/keys";
import { favoriteCountUpdater, favoriteStatusUpdater } from "@/lib/swr/updaters/favorite";
import type { FavoriteCountResponse, FavoriteStatusResponse } from "@/types/character";

export interface UseCharacterFavoriteReturn {
  isFavorite: boolean;
  favoriteCount: number;
  isLoading: boolean;
  isToggling: boolean;
  error: string | null;
  toggleFavorite: () => Promise<void>;
}

interface UseCharacterFavoriteOptions {
  /** Fetch the public favorite count (off for cards, which only show the status). */
  withCount?: boolean;
}

interface FavoriteToggleArgs {
  slug: string;
  isFavorite: boolean;
}

// Seeded by CharacterFavoriteStatusProvider and revalidated after each toggle.
const STATUS_OPTIONS = { revalidateIfStale: false, revalidateOnFocus: false };

/** Favorite status and count of one character, with an optimistic toggle. */
export function useCharacterFavorite(
  characterSlug: string,
  { withCount = true }: UseCharacterFavoriteOptions = {}
): UseCharacterFavoriteReturn {
  const { user } = useAuth();
  const { isSeeding } = useCharacterFavoriteStatus();
  const seeding = !!characterSlug && isSeeding(characterSlug);
  const [error, setError] = useState<string | null>(null);

  const { data: countData } = useSWR<FavoriteCountResponse>(
    characterSlug && withCount ? favoriteCountKey(characterSlug) : null
  );
  const { data: statusData, isLoading: statusLoading } = useSWR<FavoriteStatusResponse>(
    characterSlug && user && !seeding ? favoriteStatusKey(characterSlug) : null,
    STATUS_OPTIONS
  );

  const { trigger, isPending } = useOptimisticMutation<FavoriteToggleArgs>({
    request: ({ slug, isFavorite }) =>
      jsonRequest(favoriteStatusKey(slug), isFavorite ? "POST" : "DELETE"),
    affects: ({ slug, isFavorite }) => [
      affect<FavoriteStatusResponse>(favoriteStatusKey(slug), favoriteStatusUpdater(isFavorite)),
      affect<FavoriteCountResponse>(favoriteCountKey(slug), favoriteCountUpdater(isFavorite)),
    ],
    related: () => FAVORITE_RELATED_KEYS,
    dedupeId: ({ slug }) => `favorite:${slug}`,
  });

  const isFavorite = statusData?.isFavorite ?? false;

  const toggleFavorite = useCallback(async () => {
    if (!user || !characterSlug) return;
    setError(null);
    try {
      await trigger({ slug: characterSlug, isFavorite: !isFavorite });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }, [user, characterSlug, isFavorite, trigger]);

  return {
    isFavorite,
    favoriteCount: countData?.count ?? 0,
    isLoading: (withCount && !countData) || seeding || (!!user && statusLoading),
    isToggling: isPending,
    error,
    toggleFavorite,
  };
}
