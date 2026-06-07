"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SearchResultsDropdown } from "./SearchResultsDropdown";
import { SearchInputField, type SearchInputVariant } from "./SearchInputField";
import type { SearchResultItem } from "@/types/search";
import { useTranslations } from "next-intl";
import { useHybridSearch } from "@/hooks/useHybridSearch";

interface GameSearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
  debounceMs?: number;
  locale?: string;
  onNavigateToGame?: (slug: string) => void;
  /** Variante visuelle de l'input. Default: `"default"` (legacy). */
  variant?: SearchInputVariant;
}

export function GameSearchBar({
  onSearch,
  placeholder,
  initialValue = "",
  debounceMs = 300,
  locale = "fr",
  onNavigateToGame,
  variant = "default",
}: GameSearchBarProps) {
  const t = useTranslations("search");
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [importingId, setImportingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isHybridMode = !onSearch;

  const hybrid = useHybridSearch({
    query: searchQuery,
    locale,
    debounceMs,
    enabled: isHybridMode,
  });

  // Legacy mode: debounced search callback
  useEffect(() => {
    if (!onSearch) return;
    const timer = setTimeout(() => onSearch(searchQuery), debounceMs);
    return () => clearTimeout(timer);
  }, [searchQuery, onSearch, debounceMs]);

  // Click outside to close
  useEffect(() => {
    if (!isHybridMode) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        hybrid.close();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isHybridMode, hybrid]);

  // Escape key to close
  useEffect(() => {
    if (!isHybridMode) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") hybrid.close();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isHybridMode, hybrid]);

  const handleClear = () => {
    setSearchQuery("");
    if (isHybridMode) hybrid.clearResults();
  };

  const handleSelectGame = useCallback(
    async (item: SearchResultItem) => {
      if (item.source === "local") {
        hybrid.close();
        setSearchQuery("");
        if (onNavigateToGame) onNavigateToGame(item.slug);
        else router.push(`/${locale}/games/${item.slug}`);
      } else {
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
            alert(data.error || `Import failed with status ${response.status}`);
            throw new Error(data.error || `Import failed with status ${response.status}`);
          }
          hybrid.close();
          setSearchQuery("");
          setImportingId(null);
          if (data.game?.slug) {
            if (onNavigateToGame) onNavigateToGame(data.game.slug);
            else router.push(`/${locale}/games/${data.game.slug}`);
          }
        } catch {
          setImportingId(null);
        }
      }
    },
    [locale, router, onNavigateToGame, hybrid]
  );

  const handleSubmit = () => {
    if (onSearch) {
      onSearch(searchQuery);
    } else if (searchQuery.length >= 2) {
      hybrid.close();
      router.push(`/${locale}/games?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <SearchInputField
        value={searchQuery}
        onChange={setSearchQuery}
        onFocus={() => isHybridMode && hybrid.open()}
        onSubmit={handleSubmit}
        onClear={handleClear}
        placeholder={placeholder || t("placeholder")}
        variant={variant}
      />

      {isHybridMode && hybrid.isOpen && searchQuery.length >= 2 && (
        <SearchResultsDropdown
          results={hybrid.results}
          isLoading={hybrid.isLoading}
          isLoadingMore={hybrid.isLoadingMore}
          hasMore={hybrid.hasMore}
          onSelectGame={handleSelectGame}
          onSeeAll={hybrid.loadMore}
          importingId={importingId}
        />
      )}
    </div>
  );
}
