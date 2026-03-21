"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

interface CharacterFavoriteStatusContextValue {
  /** Vérifie si un personnage est favori (undefined = pas encore chargé) */
  getStatus: (slug: string) => boolean | undefined;
  /** Met à jour le statut local d'un personnage (après toggle) */
  setStatus: (slug: string, isFavorite: boolean) => void;
  /** Indique si le batch est en cours de chargement */
  loading: boolean;
}

const CharacterFavoriteStatusContext = createContext<CharacterFavoriteStatusContextValue>({
  getStatus: () => undefined,
  setStatus: () => {},
  loading: true,
});

export function useCharacterFavoriteStatus() {
  return useContext(CharacterFavoriteStatusContext);
}

interface CharacterFavoriteStatusProviderProps {
  slugs: string[];
  children: React.ReactNode;
}

export function CharacterFavoriteStatusProvider({
  slugs,
  children,
}: CharacterFavoriteStatusProviderProps) {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef<string>("");

  useEffect(() => {
    if (!user || slugs.length === 0) {
      setLoading(false);
      return;
    }

    // Éviter de re-fetcher si les slugs n'ont pas changé
    const slugsKey = slugs.join(",");
    if (fetchedRef.current === slugsKey) return;
    fetchedRef.current = slugsKey;

    const fetchBatchStatus = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/favorites/characters/batch-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slugs }),
        });

        if (response.ok) {
          const data = await response.json();
          setStatuses(data.statuses || {});
        }
      } catch {
        // Silently fail — les cœurs resteront en état "non favori"
      } finally {
        setLoading(false);
      }
    };

    fetchBatchStatus();
  }, [user, slugs]);

  const getStatus = useCallback((slug: string) => statuses[slug], [statuses]);

  const setStatus = useCallback((slug: string, isFavorite: boolean) => {
    setStatuses((prev) => ({ ...prev, [slug]: isFavorite }));
  }, []);

  return (
    <CharacterFavoriteStatusContext.Provider value={{ getStatus, setStatus, loading }}>
      {children}
    </CharacterFavoriteStatusContext.Provider>
  );
}
