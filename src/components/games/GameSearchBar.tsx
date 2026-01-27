"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { SearchResultsDropdown } from "./SearchResultsDropdown";
import { SearchResultItem, HybridSearchResponse } from "@/types/search";
import { useTranslations } from "next-intl";

interface GameSearchBarProps {
  /** Legacy mode: callback when search query changes (disables hybrid search) */
  onSearch?: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
  debounceMs?: number;
  locale?: string;
  /** Hybrid mode: callback when navigating to a game */
  onNavigateToGame?: (slug: string) => void;
}

const INITIAL_LIMIT = 5;
const EXPANDED_LIMIT = 500;

export function GameSearchBar({
  onSearch,
  placeholder,
  initialValue = "",
  debounceMs = 300,
  locale = "fr",
  onNavigateToGame,
}: GameSearchBarProps) {
  const t = useTranslations("search");
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialValue);

  // Hybrid search state (only used when onSearch is not provided)
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Determine if we're in hybrid mode (no onSearch callback)
  const isHybridMode = !onSearch;

  // Legacy mode: debounced search callback
  useEffect(() => {
    if (!onSearch) return;

    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch, debounceMs]);

  // Hybrid mode: fetch search results with debounce
  useEffect(() => {
    if (!isHybridMode) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Don't search if query is too short
    if (searchQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      setIsExpanded(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);
    setIsExpanded(false);

    const timer = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const params = new URLSearchParams({
          query: searchQuery,
          locale,
          localLimit: String(INITIAL_LIMIT),
          igdbLimit: String(INITIAL_LIMIT),
        });

        const response = await fetch(`/api/search/hybrid?${params}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data: HybridSearchResponse = await response.json();

        if (!controller.signal.aborted) {
          setResults(data.results);
          setHasMore(data.hasMore);
          setIsLoading(false);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Search error:", error);
          setResults([]);
          setIsLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchQuery, locale, debounceMs, isHybridMode]);

  // Handle click outside to close dropdown (hybrid mode only)
  useEffect(() => {
    if (!isHybridMode) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isHybridMode]);

  // Handle escape key to close dropdown (hybrid mode only)
  useEffect(() => {
    if (!isHybridMode) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isHybridMode]);

  const handleClear = () => {
    setSearchQuery("");
    if (isHybridMode) {
      setResults([]);
      setIsOpen(false);
      setIsExpanded(false);
    }
  };

  const handleSelectGame = useCallback(
    async (item: SearchResultItem) => {
      if (item.source === "local") {
        // Navigate to local game page
        setIsOpen(false);
        setSearchQuery("");

        if (onNavigateToGame) {
          onNavigateToGame(item.slug);
        } else {
          router.push(`/${locale}/games/${item.slug}`);
        }

        // Trigger background sync if game has igdbId
        if (item.igdbId) {
          try {
            await fetch(`/api/games/${item.slug}/sync`, {
              method: "POST",
            });
          } catch (error) {
            // Fire-and-forget, log error but don't block navigation
            console.error("Background sync error:", error);
          }
        }
      } else {
        // Import IGDB game
        if (!item.igdbId) return;

        setImportingId(item.id);

        try {
          const response = await fetch("/api/games/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ igdbId: item.igdbId }),
          });

          const data = await response.json();

          if (!response.ok) {
            console.error("Import failed:", response.status, data);
            // Show user-friendly error
            alert(data.error || `Import failed with status ${response.status}`);
            throw new Error(data.error || `Import failed with status ${response.status}`);
          }

          setIsOpen(false);
          setSearchQuery("");
          setImportingId(null);

          // Navigate to the newly created game
          if (data.game?.slug) {
            if (onNavigateToGame) {
              onNavigateToGame(data.game.slug);
            } else {
              router.push(`/${locale}/games/${data.game.slug}`);
            }
          }
        } catch (error) {
          console.error("Import error:", error);
          setImportingId(null);
          // Could show a toast here for error feedback
        }
      }
    },
    [locale, router, onNavigateToGame]
  );

  const handleSeeAll = useCallback(async () => {
    // Load more results instead of navigating
    if (isExpanded || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      const params = new URLSearchParams({
        query: searchQuery,
        locale,
        localLimit: String(EXPANDED_LIMIT),
        igdbLimit: String(EXPANDED_LIMIT),
      });

      const response = await fetch(`/api/search/hybrid?${params}`);

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data: HybridSearchResponse = await response.json();
      setResults(data.results);
      setHasMore(data.hasMore);
      setIsExpanded(true);
    } catch (error) {
      console.error("Load more error:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [searchQuery, locale, isExpanded, isLoadingMore]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    } else if (searchQuery.length >= 2) {
      // Navigate to games page on form submit
      setIsOpen(false);
      router.push(`/${locale}/games?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className="group relative">
          {/* Search icon */}
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <svg
              className="h-5 w-5 text-blue-500 transition-colors group-focus-within:text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <Input
            type="text"
            placeholder={placeholder || t("placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => isHybridMode && searchQuery.length >= 2 && setIsOpen(true)}
            className="h-10 w-full rounded-xl border-2 border-blue-200 bg-blue-50/50 pl-11 pr-10 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-all duration-300 hover:border-blue-300 hover:bg-white hover:shadow-md focus:border-blue-500 focus:bg-white focus:shadow-lg focus:ring-2 focus:ring-blue-500/20 sm:h-12 sm:pl-12 sm:pr-12 sm:text-base"
          />

          {/* Clear button */}
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 transition-all duration-200 hover:scale-110 hover:text-red-500"
            >
              <div className="rounded-full bg-gray-100 p-1 transition-colors hover:bg-red-100">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </button>
          )}
        </div>
      </form>

      {/* Hybrid mode: search results dropdown */}
      {isHybridMode && isOpen && searchQuery.length >= 2 && (
        <SearchResultsDropdown
          results={results}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore && !isExpanded}
          onSelectGame={handleSelectGame}
          onSeeAll={handleSeeAll}
          importingId={importingId}
        />
      )}
    </div>
  );
}
