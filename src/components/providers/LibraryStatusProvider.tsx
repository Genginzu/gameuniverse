"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

interface LibraryStatusContextValue {
  /** Vérifie si un jeu est dans la bibliothèque (undefined = pas encore chargé) */
  getStatus: (gameId: string) => boolean | undefined;
  /** Met à jour le statut local d'un jeu (après add/remove) */
  setStatus: (gameId: string, inLibrary: boolean) => void;
  /** Indique si le batch est en cours de chargement */
  loading: boolean;
}

const LibraryStatusContext = createContext<LibraryStatusContextValue>({
  getStatus: () => undefined,
  setStatus: () => {},
  loading: true,
});

export function useLibraryStatus() {
  return useContext(LibraryStatusContext);
}

interface LibraryStatusProviderProps {
  gameIds: string[];
  children: React.ReactNode;
}

export function LibraryStatusProvider({ gameIds, children }: LibraryStatusProviderProps) {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef<string>("");

  useEffect(() => {
    if (!user || gameIds.length === 0) {
      setLoading(false);
      return;
    }

    // Éviter de re-fetcher si les IDs n'ont pas changé
    const idsKey = gameIds.join(",");
    if (fetchedRef.current === idsKey) return;
    fetchedRef.current = idsKey;

    const fetchBatchStatus = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/library/batch-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameIds }),
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
  }, [user, gameIds]);

  const getStatus = useCallback((gameId: string) => statuses[gameId], [statuses]);

  const setStatus = useCallback((gameId: string, inLibrary: boolean) => {
    setStatuses((prev) => ({ ...prev, [gameId]: inLibrary }));
  }, []);

  return (
    <LibraryStatusContext.Provider value={{ getStatus, setStatus, loading }}>
      {children}
    </LibraryStatusContext.Provider>
  );
}
