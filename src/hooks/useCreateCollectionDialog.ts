"use client";

import { useCallback, useState } from "react";
import { useCollectionMutations } from "./useCollectionMutations";

interface CreateCollectionData {
  name: string;
  description?: string;
  isPublic?: boolean;
}

/**
 * Encapsulates the create-collection dialog state and submit handler shared by
 * the self and profile collection pages. The collection list refreshes itself.
 */
export function useCreateCollectionDialog(playerId: string) {
  const { createCollection } = useCollectionMutations({ playerId });

  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = useCallback(
    async (data: Record<string, unknown>) => {
      setIsCreating(true);
      try {
        await createCollection(data as unknown as CreateCollectionData);
        setIsOpen(false);
      } finally {
        setIsCreating(false);
      }
    },
    [createCollection]
  );

  return { isOpen, setIsOpen, isCreating, handleCreate };
}
