"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";

export function useGameLibraryStatus(gameId: string) {
  const { user } = useAuth();
  const [inLibrary, setInLibrary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // Check if game is in library
  const checkStatus = useCallback(async () => {
    if (!user || !gameId) {
      setInLibrary(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/library/${gameId}`);
      if (response.ok) {
        const data = await response.json();
        setInLibrary(data.inLibrary);
      }
    } catch (err) {
      console.error("Error checking library status:", err);
    } finally {
      setLoading(false);
    }
  }, [user, gameId]);

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
        const errorData = await response.json();
        console.error("Failed to add to library:", errorData.error);
        return false;
      }
    } catch (err) {
      console.error("Error adding to library:", err);
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
        console.error("Failed to remove from library");
        return false;
      }
    } catch (err) {
      console.error("Error removing from library:", err);
      return false;
    }
  }, [user, gameId]);

  // Check status on mount and when dependencies change
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    inLibrary,
    loading,
    adding,
    addToLibrary,
    removeFromLibrary,
    refetch: checkStatus,
  };
}
