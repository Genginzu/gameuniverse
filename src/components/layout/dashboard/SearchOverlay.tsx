"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { GlobalSearchDropdown } from "@/components/shared/GlobalSearchDropdown";
import { getResultUrl, type FlatSearchItem } from "@/lib/utils/global-search-utils";
import type { GlobalSearchResponse } from "@/types/global-search";

const EMPTY_RESULTS: GlobalSearchResponse = {
  games: [],
  characters: [],
  players: [],
  teams: [],
  proPlayers: [],
  coaches: [],
  counts: {
    games: 0,
    characters: 0,
    players: 0,
    teams: 0,
    proPlayers: 0,
    coaches: 0,
  },
};

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const t = useTranslations("globalSearch");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [importingId, setImportingId] = useState<string | null>(null);

  const {
    query,
    setQuery,
    results,
    isLoading,
    isOpen: isDropdownOpen,
    setIsOpen: setDropdownOpen,
    activeIndex,
    flatItems,
    handleKeyDown: searchKeyDown,
  } = useGlobalSearch();

  // Auto-focus input when overlay opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Reset search state when overlay closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setDropdownOpen(false);
    }
  }, [isOpen, setQuery, setDropdownOpen]);

  const navigateAndClose = useCallback(
    (url: string) => {
      router.push(url);
      onClose();
    },
    [router, onClose]
  );

  const handleSelect = useCallback(
    async (item: FlatSearchItem) => {
      const url = getResultUrl(item);
      if (url) {
        navigateAndClose(url);
        return;
      }
      // IGDB game import
      if (item.type === "game" && item.source === "igdb" && item.igdbId) {
        setImportingId(item.id);
        try {
          const res = await fetch("/api/games/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ igdbId: item.igdbId }),
          });
          const data = await res.json();
          if (!res.ok) {
            setImportingId(null);
            return;
          }
          setImportingId(null);
          if (data.game?.slug) navigateAndClose(`/games/${data.game.slug}`);
        } catch {
          setImportingId(null);
        }
      }
    },
    [navigateAndClose]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Close on Escape
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      // Handle Enter for IGDB import
      if (e.key === "Enter" && isDropdownOpen) {
        const item = flatItems[activeIndex];
        if (item?.type === "game" && item.source === "igdb") {
          e.preventDefault();
          handleSelect(item);
          return;
        }
      }
      searchKeyDown(e);
    },
    [onClose, isDropdownOpen, activeIndex, flatItems, handleSelect, searchKeyDown]
  );

  // Focus trap: cycle between input and close button
  const handleFocusTrap = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const focusable = [inputRef.current, closeButtonRef.current].filter(Boolean) as HTMLElement[];
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  const showResults = results !== null || isLoading;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("placeholder")}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 pt-[12vh] backdrop-blur-xs"
      onClick={handleBackdropClick}
      onKeyDown={handleFocusTrap}
    >
      <div ref={panelRef} className="mx-4 flex w-full max-w-6xl flex-col items-center">
        {/* Search input — centered, narrower than results */}
        <div className="relative w-full max-w-3xl">
          <input
            ref={inputRef}
            type="text"
            placeholder={t("placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            className="h-16 w-full border-b-2 border-white bg-transparent text-xl font-light text-white placeholder-white/40 caret-white focus:outline-hidden sm:text-4xl"
            aria-label={t("placeholder")}
            aria-autocomplete="list"
            role="combobox"
            aria-expanded={showResults}
          />
          {/* Loading indicator */}
          {isLoading && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <Icon icon="lucide:loader-2" className="h-6 w-6 animate-spin text-white/60" />
            </div>
          )}
          {/* Clear button */}
          {query && !isLoading && (
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute inset-y-0 right-0 flex items-center pr-2 text-white/40 transition-colors hover:text-white focus:outline-hidden"
              aria-label="Clear"
            >
              <Icon icon="lucide:x" className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Results — full width */}
        {showResults && (
          <div className="mt-8 max-h-[65vh] w-full overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <GlobalSearchDropdown
              results={results ?? EMPTY_RESULTS}
              flatItems={flatItems}
              activeIndex={activeIndex}
              isLoading={isLoading}
              onSelect={handleSelect}
              importingId={importingId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
