"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import type { CharacterFavoriteSummary } from "@/types/character";

export interface UseCharacterFavoritesReturn {
  characters: CharacterFavoriteSummary[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook for the current user's favorites page.
 * Fetches from GET /api/favorites/characters (auth required).
 */
export function useCharacterFavorites(): UseCharacterFavoritesReturn {
  const locale = useLocale();
  const [characters, setCharacters] = useState<CharacterFavoriteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchFavorites = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/favorites/characters?locale=${locale}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to fetch favorites");
        }

        const data = await res.json();
        setCharacters(data.characters || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setCharacters([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [locale]);

  return { characters, loading, error };
}

/**
 * Hook for a player's profile — public favorites.
 * Fetches from GET /api/players/[id]/favorite-characters.
 */
export function usePlayerFavoriteCharacters(playerId: string): UseCharacterFavoritesReturn {
  const locale = useLocale();
  const [characters, setCharacters] = useState<CharacterFavoriteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current || !playerId) {
      if (!playerId) setLoading(false);
      return;
    }
    hasFetchedRef.current = true;

    const fetchFavorites = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/players/${playerId}/favorite-characters?locale=${locale}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to fetch player favorites");
        }

        const data = await res.json();
        setCharacters(data.characters || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setCharacters([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [playerId, locale]);

  return { characters, loading, error };
}
