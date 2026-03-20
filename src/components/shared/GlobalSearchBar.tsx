"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { GlobalSearchDropdown } from "@/components/shared/GlobalSearchDropdown";
import { getResultUrl, type FlatSearchItem } from "@/lib/utils/global-search-utils";
import type { GlobalSearchResponse } from "@/types/global-search";

const EMPTY_RESULTS: GlobalSearchResponse = {
  games: [],
  characters: [],
  players: [],
  counts: { games: 0, characters: 0, players: 0 },
};

export function GlobalSearchBar() {
  const t = useTranslations("globalSearch");
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [importingId, setImportingId] = useState<string | null>(null);
  const {
    query,
    setQuery,
    results,
    isLoading,
    isOpen,
    setIsOpen,
    activeIndex,
    flatItems,
    handleKeyDown,
  } = useGlobalSearch();

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [setIsOpen]);

  const navigateAndClose = useCallback(
    (url: string) => {
      router.push(url);
      setIsOpen(false);
      setQuery("");
    },
    [router, setIsOpen, setQuery]
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
      if (e.key === "Enter" && isOpen) {
        const item = flatItems[activeIndex];
        if (item?.type === "game" && item.source === "igdb") {
          e.preventDefault();
          handleSelect(item);
          return;
        }
      }
      handleKeyDown(e);
    },
    [isOpen, activeIndex, flatItems, handleKeyDown, handleSelect]
  );

  const showDropdown = isOpen && (results !== null || isLoading);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <div className="group relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            ) : (
              <Search className="h-5 w-5 text-blue-500 transition-colors group-focus-within:text-blue-600" />
            )}
          </div>
          <Input
            type="text"
            placeholder={t("placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => query.trim().length >= 2 && results && setIsOpen(true)}
            className="h-10 w-full rounded-xl border-2 border-blue-200 bg-blue-50/50 pl-11 pr-10 text-sm text-gray-900 placeholder-gray-500 shadow-xs transition-all duration-300 hover:border-blue-300 hover:bg-white hover:shadow-md focus:border-blue-500 focus:bg-white focus:shadow-lg focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:hover:border-gray-500 dark:hover:bg-gray-700 dark:focus:border-blue-500 dark:focus:bg-gray-700 sm:h-12 sm:pl-12 sm:pr-12 sm:text-base"
            aria-label={t("placeholder")}
            aria-expanded={showDropdown}
            aria-haspopup="listbox"
            role="combobox"
            aria-autocomplete="list"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setIsOpen(false);
              }}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 transition-all duration-200 hover:scale-110 hover:text-red-500"
            >
              <div className="rounded-full bg-gray-100 p-1 transition-colors hover:bg-red-100 dark:bg-gray-700 dark:hover:bg-red-900/30">
                <X className="h-4 w-4" />
              </div>
            </button>
          )}
        </div>
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl bg-white shadow-lg ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
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
  );
}
