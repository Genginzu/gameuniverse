import { useState, useEffect, useRef, useCallback } from "react";
import type { SearchResultItem, HybridSearchResponse } from "@/types/search";

const INITIAL_LIMIT = 5;
const EXPANDED_LIMIT = 500;

interface UseHybridSearchOptions {
  query: string;
  locale: string;
  debounceMs: number;
  enabled: boolean;
}

export function useHybridSearch({ query, locale, debounceMs, enabled }: UseHybridSearchOptions) {
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch search results with debounce
  useEffect(() => {
    if (!enabled) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (query.length < 2) {
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
          query,
          locale,
          localLimit: String(INITIAL_LIMIT),
          igdbLimit: String(INITIAL_LIMIT),
        });

        const response = await fetch(`/api/search/hybrid?${params}`, {
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("Search failed");

        const data: HybridSearchResponse = await response.json();

        if (!controller.signal.aborted) {
          setResults(data.results);
          setHasMore(data.hasMore);
          setIsLoading(false);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
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
  }, [query, locale, debounceMs, enabled]);

  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => {
    if (query.length >= 2) setIsOpen(true);
  }, [query]);

  const clearResults = useCallback(() => {
    setResults([]);
    setIsOpen(false);
    setIsExpanded(false);
  }, []);

  const loadMore = useCallback(async () => {
    if (isExpanded || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const params = new URLSearchParams({
        query,
        locale,
        localLimit: String(EXPANDED_LIMIT),
        igdbLimit: String(EXPANDED_LIMIT),
      });

      const response = await fetch(`/api/search/hybrid?${params}`);
      if (!response.ok) throw new Error("Search failed");

      const data: HybridSearchResponse = await response.json();
      setResults(data.results);
      setHasMore(data.hasMore);
      setIsExpanded(true);
    } catch {
      // Search expansion failed silently
    } finally {
      setIsLoadingMore(false);
    }
  }, [query, locale, isExpanded, isLoadingMore]);

  return {
    results,
    isLoading,
    isLoadingMore,
    hasMore: hasMore && !isExpanded,
    isOpen,
    close,
    open,
    clearResults,
    loadMore,
  };
}
