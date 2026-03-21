"use client";

import { useCallback } from "react";
import { useCharacterFavorite } from "@/hooks/useCharacterFavorite";
import { useCharacterFavoriteStatus } from "@/components/providers/CharacterFavoriteStatusProvider";

interface EntityCharacterFavoriteReturn {
  isFavorite: boolean;
  loading: boolean;
  toggling: boolean;
  handleToggle: (e: React.MouseEvent) => Promise<void>;
}

/**
 * Unifie la logique batch (CharacterFavoriteStatusProvider) et individuelle
 * (useCharacterFavorite) pour le bouton favori d'une EntityCard.
 */
export function useEntityCharacterFavorite(
  slug: string,
  enabled: boolean
): EntityCharacterFavoriteReturn {
  // Batch context (fourni par CharacterFavoriteStatusProvider sur la page characters)
  const batchCtx = useCharacterFavoriteStatus();
  const batchStatus = batchCtx.getStatus(slug);
  const useBatch = enabled && batchStatus !== undefined;

  // Hook individuel — désactivé quand le batch fournit déjà le statut
  const {
    isFavorite: individualFav,
    isLoading: individualLoading,
    isToggling: individualToggling,
    toggleFavorite: individualToggle,
  } = useCharacterFavorite(enabled && !useBatch ? slug : "");

  const isFavorite = useBatch ? batchStatus : individualFav;
  const loading = useBatch ? batchCtx.loading : individualLoading;
  const toggling = useBatch ? false : individualToggling;

  const handleToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (useBatch) {
        // Optimistic update via batch context + call individual endpoint
        const prev = isFavorite;
        batchCtx.setStatus(slug, !prev);
        try {
          const method = prev ? "DELETE" : "POST";
          const res = await fetch(`/api/characters/${slug}/favorite`, { method });
          if (!res.ok) batchCtx.setStatus(slug, prev);
        } catch {
          batchCtx.setStatus(slug, prev);
        }
      } else {
        await individualToggle();
      }
    },
    [useBatch, isFavorite, batchCtx, slug, individualToggle]
  );

  return { isFavorite, loading, toggling, handleToggle };
}
