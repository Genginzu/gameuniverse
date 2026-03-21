"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGameLibraryStatus } from "@/hooks/useGameLibraryStatus";
import { useLibraryStatus } from "@/components/providers/LibraryStatusProvider";

interface EntityLibraryToggleReturn {
  inLibrary: boolean;
  loading: boolean;
  adding: boolean;
  handleToggle: (e: React.MouseEvent) => Promise<void>;
}

/**
 * Unifie la logique batch (LibraryStatusProvider) et individuelle
 * (useGameLibraryStatus) pour le bouton bibliothèque d'une EntityCard.
 */
export function useEntityLibraryToggle(
  entityId: string,
  enabled: boolean,
  onRemovedFromLibrary?: (id: string) => void
): EntityLibraryToggleReturn {
  const { user } = useAuth();

  // Batch context (fourni par LibraryStatusProvider sur la page games)
  const batchCtx = useLibraryStatus();
  const batchStatus = batchCtx.getStatus(entityId);
  const useBatch = enabled && batchStatus !== undefined;

  // Hook individuel — désactivé quand le batch fournit déjà le statut
  const individual = useGameLibraryStatus(enabled && !useBatch ? entityId : "");

  const inLibrary = useBatch ? batchStatus : individual.inLibrary;
  const loading = useBatch ? batchCtx.loading : individual.loading;
  const [adding, setAdding] = useState(false);

  const addToLibrary = useCallback(async () => {
    if (!user || !entityId || adding) return false;
    if (useBatch) {
      setAdding(true);
      try {
        const res = await fetch("/api/library", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId: entityId }),
        });
        if (res.ok) {
          batchCtx.setStatus(entityId, true);
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        setAdding(false);
      }
    }
    return individual.addToLibrary();
  }, [user, entityId, adding, useBatch, batchCtx, individual]);

  const removeFromLibrary = useCallback(async () => {
    if (!user || !entityId) return false;
    if (useBatch) {
      try {
        const res = await fetch(`/api/library/${entityId}`, { method: "DELETE" });
        if (res.ok) {
          batchCtx.setStatus(entityId, false);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    }
    return individual.removeFromLibrary();
  }, [user, entityId, useBatch, batchCtx, individual]);

  const handleToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (inLibrary) {
        const success = await removeFromLibrary();
        if (success && onRemovedFromLibrary) onRemovedFromLibrary(entityId);
      } else {
        await addToLibrary();
      }
    },
    [inLibrary, removeFromLibrary, addToLibrary, onRemovedFromLibrary, entityId]
  );

  return { inLibrary, loading, adding, handleToggle };
}
