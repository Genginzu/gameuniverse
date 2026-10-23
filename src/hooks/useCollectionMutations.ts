"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { useOptimisticMutation } from "./useOptimisticMutation";
import { collectionMutationSpecs } from "@/lib/swr/collectionMutationSpecs";
import type {
  AddCollectionItemInput,
  CreateCollectionInput,
  UpdateCollectionInput,
} from "@/types/collection";

/**
 * CRUD mutations of a player's collections. List, stats and detail stay fresh
 * without caller callbacks; each mutation rejects with the server message
 * after rolling back its optimistic changes.
 */
export function useCollectionMutations({ playerId }: { playerId: string }) {
  const locale = useLocale();
  const specs = collectionMutationSpecs(playerId, locale);

  const { trigger: create } = useOptimisticMutation(specs.create);
  const { trigger: update } = useOptimisticMutation(specs.update);
  const { trigger: remove } = useOptimisticMutation(specs.remove);
  const { trigger: visibility } = useOptimisticMutation(specs.visibility);
  const { trigger: addItem } = useOptimisticMutation(specs.addItem);
  const { trigger: removeItem } = useOptimisticMutation(specs.removeItem);
  const { trigger: updateItemNote } = useOptimisticMutation(specs.updateItemNote);

  return useMemo(
    () => ({
      createCollection: (input: CreateCollectionInput) => create(input),
      updateCollection: (slug: string, input: UpdateCollectionInput) => update({ slug, input }),
      deleteCollection: async (slug: string) => {
        await remove(slug);
      },
      toggleVisibility: (slug: string, currentIsPublic: boolean) =>
        visibility({ slug, isPublic: !currentIsPublic }),
      addItem: (slug: string, input: AddCollectionItemInput) => addItem({ slug, input }),
      removeItem: async (slug: string, gameId: string) => {
        await removeItem({ slug, gameId });
      },
      updateItemNote: async (slug: string, gameId: string, note: string | null) => {
        await updateItemNote({ slug, gameId, note });
      },
    }),
    [create, update, remove, visibility, addItem, removeItem, updateItemNote]
  );
}
