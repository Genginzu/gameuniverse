"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";

export interface UseCharacterFavoriteReturn {
  isFavorite: boolean;
  favoriteCount: number;
  isLoading: boolean;
  isToggling: boolean;
  error: string | null;
  toggleFavorite: () => Promise<void>;
}

export function useCharacterFavorite(characterSlug: string): UseCharacterFavoriteReturn {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedCountRef = useRef(false);
  const hasFetchedStatusRef = useRef(false);

  // Fetch count on mount (doesn't need auth)
  useEffect(() => {
    if (hasFetchedCountRef.current || !characterSlug) {
      if (!characterSlug) setIsLoading(false);
      return;
    }

    hasFetchedCountRef.current = true;

    const fetchCount = async () => {
      try {
        const countRes = await fetch(`/api/characters/${characterSlug}/favorite/count`);
        if (countRes.ok) {
          const countData = await countRes.json();
          setFavoriteCount(countData.count);
        }
      } catch {
        // Erreur ignorée — le compteur n'est pas critique
      } finally {
        if (!user) setIsLoading(false);
      }
    };

    fetchCount();
  }, [characterSlug, user]);

  // Fetch user favorite status when user becomes available
  useEffect(() => {
    if (hasFetchedStatusRef.current || !characterSlug || !user) return;

    hasFetchedStatusRef.current = true;

    const fetchStatus = async () => {
      try {
        setIsLoading(true);
        const statusRes = await fetch(`/api/characters/${characterSlug}/favorite`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setIsFavorite(statusData.isFavorite === true);
        }
      } catch {
        // Erreur ignorée — le statut favori n'est pas critique
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [characterSlug, user]);

  // Toggle favorite with optimistic update and rollback
  const toggleFavorite = useCallback(async () => {
    if (!user || !characterSlug || isToggling) return;

    const prevIsFavorite = isFavorite;
    const prevCount = favoriteCount;

    // Optimistic update
    setIsFavorite(!prevIsFavorite);
    setFavoriteCount(prevIsFavorite ? prevCount - 1 : prevCount + 1);
    setIsToggling(true);
    setError(null);

    try {
      const method = prevIsFavorite ? "DELETE" : "POST";
      const res = await fetch(`/api/characters/${characterSlug}/favorite`, { method });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "An error occurred");
      }
    } catch (err) {
      // Rollback on error
      setIsFavorite(prevIsFavorite);
      setFavoriteCount(prevCount);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsToggling(false);
    }
  }, [user, characterSlug, isToggling, isFavorite, favoriteCount]);

  return { isFavorite, favoriteCount, isLoading, isToggling, error, toggleFavorite };
}
