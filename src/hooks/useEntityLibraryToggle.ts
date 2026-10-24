"use client";

import { useCallback } from "react";
import { useGameLibraryStatus } from "@/hooks/useGameLibraryStatus";

interface EntityLibraryToggleReturn {
  inLibrary: boolean;
  loading: boolean;
  adding: boolean;
  handleToggle: (e: React.MouseEvent) => Promise<void>;
}

/** Library button of an EntityCard; batch statuses arrive through the shared SWR cache. */
export function useEntityLibraryToggle(
  entityId: string,
  enabled: boolean,
  onRemovedFromLibrary?: (id: string) => void
): EntityLibraryToggleReturn {
  const { inLibrary, loading, adding, addToLibrary, removeFromLibrary } = useGameLibraryStatus(
    enabled ? entityId : ""
  );

  const handleToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!inLibrary) {
        await addToLibrary();
        return;
      }
      const removed = await removeFromLibrary();
      if (removed) onRemovedFromLibrary?.(entityId);
    },
    [inLibrary, addToLibrary, removeFromLibrary, onRemovedFromLibrary, entityId]
  );

  return { inLibrary, loading, adding, handleToggle };
}
