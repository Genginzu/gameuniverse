"use client";

import { useState, useCallback, useEffect } from "react";

interface UseSearchOverlayReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export function useSearchOverlay(): UseSearchOverlayReturn {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+K (Windows/Linux) or Cmd+K (macOS) to toggle open
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      // Escape to close
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return { isOpen, open, close };
}
