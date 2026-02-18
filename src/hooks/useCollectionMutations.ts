"use client";

import { useCallback } from "react";
import type {
  CreateCollectionInput,
  UpdateCollectionInput,
  AddCollectionItemInput,
} from "@/types/collection";
import {
  apiCreateCollection,
  apiUpdateCollection,
  apiDeleteCollection,
  apiToggleVisibility,
  apiAddItem,
  apiRemoveItem,
  apiReorderItems,
} from "@/lib/services/collectionApi";

interface UseCollectionMutationsOptions {
  playerId: string;
  /** Callback to refetch the collections list after a mutation */
  refetchCollections?: () => Promise<void>;
  /** Callback to refetch the collection detail after a mutation */
  refetchDetail?: () => Promise<void>;
}

/**
 * Hook fournissant les mutations CRUD pour les collections.
 * Chaque mutation appelle l'API correspondante puis invalide le cache via les callbacks.
 */
export function useCollectionMutations({
  playerId,
  refetchCollections,
  refetchDetail,
}: UseCollectionMutationsOptions) {
  const invalidateList = useCallback(async () => {
    await refetchCollections?.();
  }, [refetchCollections]);

  const invalidateAll = useCallback(async () => {
    await Promise.all([refetchCollections?.(), refetchDetail?.()]);
  }, [refetchCollections, refetchDetail]);

  const createCollection = useCallback(
    async (input: CreateCollectionInput) => {
      const result = await apiCreateCollection(playerId, input);
      await invalidateList();
      return result;
    },
    [playerId, invalidateList]
  );

  const updateCollection = useCallback(
    async (slug: string, input: UpdateCollectionInput) => {
      const result = await apiUpdateCollection(playerId, slug, input);
      await invalidateAll();
      return result;
    },
    [playerId, invalidateAll]
  );

  const deleteCollection = useCallback(
    async (slug: string) => {
      await apiDeleteCollection(playerId, slug);
      await invalidateList();
    },
    [playerId, invalidateList]
  );

  const toggleVisibility = useCallback(
    async (slug: string, currentIsPublic: boolean) => {
      const result = await apiToggleVisibility(playerId, slug, !currentIsPublic);
      await invalidateAll();
      return result;
    },
    [playerId, invalidateAll]
  );

  const addItem = useCallback(
    async (slug: string, input: AddCollectionItemInput) => {
      const result = await apiAddItem(playerId, slug, input);
      await invalidateAll();
      return result;
    },
    [playerId, invalidateAll]
  );

  const removeItem = useCallback(
    async (slug: string, gameId: string) => {
      await apiRemoveItem(playerId, slug, gameId);
      await invalidateAll();
    },
    [playerId, invalidateAll]
  );

  const reorderItems = useCallback(
    async (slug: string, items: Array<{ gameId: string; position: number }>) => {
      const result = await apiReorderItems(playerId, slug, items);
      await invalidateAll();
      return result;
    },
    [playerId, invalidateAll]
  );

  return {
    createCollection,
    updateCollection,
    deleteCollection,
    toggleVisibility,
    addItem,
    removeItem,
    reorderItems,
  };
}
