"use client";

import { useCallback } from "react";
import { useCharacterFavorite } from "@/hooks/useCharacterFavorite";

interface EntityCharacterFavoriteReturn {
  isFavorite: boolean;
  loading: boolean;
  toggling: boolean;
  handleToggle: (e: React.MouseEvent) => Promise<void>;
}

/** Favorite button of an EntityCard; batch statuses arrive through the shared SWR cache. */
export function useEntityCharacterFavorite(
  slug: string,
  enabled: boolean
): EntityCharacterFavoriteReturn {
  const { isFavorite, isLoading, isToggling, toggleFavorite } = useCharacterFavorite(
    enabled ? slug : "",
    { withCount: false }
  );

  const handleToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      await toggleFavorite();
    },
    [toggleFavorite]
  );

  return { isFavorite, loading: isLoading, toggling: isToggling, handleToggle };
}
