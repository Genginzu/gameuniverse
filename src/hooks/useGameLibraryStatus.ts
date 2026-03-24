"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useAuth } from "./useAuth";

interface LibraryStatusResponse {
  inLibrary: boolean;
}

/**
 * Hook pour vérifier et gérer le statut d'un jeu dans la bibliothèque.
 * SWR gère la lecture (cache + déduplication), les mutations restent manuelles.
 */
export function useGameLibraryStatus(gameId: string) {
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);

  // SWR pour la lecture du statut — clé null si pas d'user ou pas de gameId
  const { data, isLoading, mutate } = useSWR<LibraryStatusResponse>(
    user && gameId ? `/api/library/${gameId}` : null
  );

  const inLibrary = data?.inLibrary ?? false;

  const addToLibrary = useCallback(async () => {
    if (!user || !gameId || adding) return false;

    try {
      setAdding(true);
      const response = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });

      if (response.ok) {
        // Mise à jour optimiste du cache SWR
        await mutate({ inLibrary: true }, false);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setAdding(false);
    }
  }, [user, gameId, adding, mutate]);

  const removeFromLibrary = useCallback(async () => {
    if (!user || !gameId) return false;

    try {
      const response = await fetch(`/api/library/${gameId}`, { method: "DELETE" });

      if (response.ok) {
        await mutate({ inLibrary: false }, false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [user, gameId, mutate]);

  return {
    inLibrary,
    loading: isLoading,
    adding,
    addToLibrary,
    removeFromLibrary,
  };
}
