"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";

export function useGameLibraryStatus(gameId: string) {
  const { user } = useAuth();
  const [inLibrary, setInLibrary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const hasCheckedRef = useRef(false);

  // Add game to library
  const addToLibrary = useCallback(async () => {
    if (!user || !gameId || adding) return false;

    try {
      setAdding(true);
      const response = await fetch("/api/library", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gameId }),
      });

      if (response.ok) {
        setInLibrary(true);
        return true;
      } else {
        return false;
      }
    } catch {
      return false;
    } finally {
      setAdding(false);
    }
  }, [user, gameId, adding]);

  // Remove game from library
  const removeFromLibrary = useCallback(async () => {
    if (!user || !gameId) return false;

    try {
      const response = await fetch(`/api/library/${gameId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setInLibrary(false);
        return true;
      } else {
        return false;
      }
    } catch {
      return false;
    }
  }, [user, gameId]);

  // Check status only once on mount
  useEffect(() => {
    // Skip if already checked, no user, or no gameId
    if (hasCheckedRef.current || !user || !gameId) {
      if (!user || !gameId) {
        setLoading(false);
      }
      return;
    }

    hasCheckedRef.current = true;

    const checkStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/library/${gameId}`);
        if (response.ok) {
          const data = await response.json();
          setInLibrary(data.inLibrary === true);
        } else if (response.status === 500) {
          // Fonctionnalité bibliothèque pas encore disponible
          setInLibrary(false);
        } else {
          setInLibrary(false);
        }
      } catch {
        setInLibrary(false);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [user, gameId]);

  return {
    inLibrary,
    loading,
    adding,
    addToLibrary,
    removeFromLibrary,
  };
}
