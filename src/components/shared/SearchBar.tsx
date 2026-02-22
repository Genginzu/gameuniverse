"use client";

import { useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { Input } from "@/components/ui/input";

/**
 * Search result item for hybrid search mode
 */
export interface SearchResultItem {
  id: string;
  title: string;
  [key: string]: unknown;
}

/**
 * Configuration for hybrid search mode with dropdown results
 */
export interface HybridSearchConfig<T extends SearchResultItem> {
  enabled: true;
  /** Function to fetch search results */
  searchFn: (query: string) => Promise<{ results: T[]; hasMore: boolean }>;
  /** Callback when a result is selected */
  onSelect: (result: T) => void;
  /** Custom renderer for each result item */
  resultRenderer: (result: T, isImporting: boolean) => ReactNode;
  /** Callback when "See All" is clicked */
  onSeeAll?: () => void;
  /** Minimum query length to trigger search (default: 2) */
  minQueryLength?: number;
  /** Loading indicator component */
  loadingComponent?: ReactNode;
  /** No results component */
  noResultsComponent?: ReactNode;
}

export interface SearchBarProps<T extends SearchResultItem = SearchResultItem> {
  /** Callback when search query changes (simple mode) */
  onSearch: (query: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Optional hybrid search configuration for advanced search with dropdown */
  hybridConfig?: HybridSearchConfig<T>;
  /** Initial search value */
  initialValue?: string;
  /** Additional CSS classes */
  className?: string;
  /** Show search indicator below input */
  showSearchIndicator?: boolean;
  /** Search indicator text (when showSearchIndicator is true) */
  searchIndicatorText?: string;
}

/**
 * Generic SearchBar component that supports both simple debounced search
 * and hybrid search with dropdown results.
 *
 * @example
 * // Simple mode with debounced callback
 * <SearchBar
 *   onSearch={(query) => console.log(query)}
 *   placeholder="Search..."
 * />
 *
 * // Hybrid mode with dropdown results
 * <SearchBar
 *   onSearch={(query) => console.log(query)}
 *   hybridConfig={{
 *     enabled: true,
 *     searchFn: async (query) => fetchResults(query),
 *     onSelect: (result) => navigate(result.slug),
 *     resultRenderer: (result) => <ResultItem {...result} />,
 *   }}
 * />
 */
export function SearchBar<T extends SearchResultItem = SearchResultItem>({
  onSearch,
  placeholder = "Search...",
  debounceMs = 300,
  hybridConfig,
  initialValue = "",
  className = "",
  showSearchIndicator = false,
  searchIndicatorText = "Searching for",
}: SearchBarProps<T>) {
  const [searchQuery, setSearchQuery] = useState(initialValue);

  // Hybrid search state
  const [results, setResults] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isHybridMode = hybridConfig?.enabled ?? false;
  const minQueryLength = hybridConfig?.minQueryLength ?? 2;

  // Debounced search callback (always active)
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch, debounceMs]);

  // Hybrid mode: fetch search results with debounce
  useEffect(() => {
    if (!isHybridMode || !hybridConfig) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Don't search if query is too short
    if (searchQuery.length < minQueryLength) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    const timer = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const data = await hybridConfig.searchFn(searchQuery);

        if (!controller.signal.aborted) {
          setResults(data.results as T[]);
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
  }, [searchQuery, debounceMs, isHybridMode, hybridConfig, minQueryLength]);

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

  const handleClear = useCallback(() => {
    setSearchQuery("");
    if (isHybridMode) {
      setResults([]);
      setIsOpen(false);
    }
  }, [isHybridMode]);

  const handleSelectResult = useCallback(
    (result: T) => {
      if (!hybridConfig) return;

      setImportingId(result.id);
      hybridConfig.onSelect(result);
      setIsOpen(false);
      setSearchQuery("");
      setImportingId(null);
    },
    [hybridConfig]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  // Render dropdown content for hybrid mode
  const renderDropdown = () => {
    if (!isHybridMode || !isOpen || searchQuery.length < minQueryLength) {
      return null;
    }

    // Loading state
    if (isLoading) {
      return (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl bg-white shadow-lg ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
          {hybridConfig?.loadingComponent || (
            <div className="flex items-center justify-center p-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Loading...</span>
            </div>
          )}
        </div>
      );
    }

    // No results state
    if (results.length === 0) {
      return (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl bg-white shadow-lg ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
          {hybridConfig?.noResultsComponent || (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              No results found
            </div>
          )}
        </div>
      );
    }

    // Results list
    return (
      <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl bg-white shadow-lg ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {results.map((result) => (
            <li key={result.id}>
              <button
                type="button"
                onClick={() => handleSelectResult(result)}
                disabled={importingId === result.id}
                className="w-full text-left transition-colors hover:bg-gray-50 disabled:cursor-wait disabled:opacity-70 dark:hover:bg-gray-700"
              >
                {hybridConfig?.resultRenderer(result, importingId === result.id)}
              </button>
            </li>
          ))}
        </ul>

        {/* See all results link */}
        {hasMore && hybridConfig?.onSeeAll && (
          <div className="border-t border-gray-100 p-2 dark:border-gray-700">
            <button
              type="button"
              onClick={hybridConfig.onSeeAll}
              className="flex w-full items-center justify-center gap-2 rounded-lg p-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
            >
              See all results
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="group relative">
          {/* Search icon */}
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <svg
              className="h-5 w-5 text-gray-400 transition-colors group-focus-within:text-blue-500"
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
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => isHybridMode && searchQuery.length >= minQueryLength && setIsOpen(true)}
            className="h-12 w-full rounded-2xl border-0 bg-white pl-12 pr-12 text-sm text-gray-900 placeholder-gray-400 shadow-lg ring-1 ring-gray-200 transition-all duration-300 hover:shadow-xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:ring-gray-700 sm:h-14 sm:text-base"
          />

          {/* Clear button */}
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 transition-all duration-200 hover:scale-110 hover:text-red-500"
            >
              <div className="rounded-full bg-gray-100 p-1 transition-colors hover:bg-red-100 dark:bg-gray-700 dark:hover:bg-red-900/30">
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

        {/* Search indicator (simple mode) */}
        {showSearchIndicator && searchQuery && !isHybridMode && (
          <div className="absolute left-0 right-0 top-full z-10 mt-2 rounded-xl bg-white shadow-lg ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
            <div className="p-3">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                {searchIndicatorText} &quot;{searchQuery}&quot;
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Hybrid mode: search results dropdown */}
      {renderDropdown()}
    </div>
  );
}

/**
 * Helper function to check if a query should trigger search.
 * Exported for testing purposes.
 */
export function shouldTriggerSearch(query: string, minLength: number = 2): boolean {
  return query.length >= minLength;
}

/**
 * Helper function to create a debounced callback.
 * Exported for testing purposes.
 */
export function createDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): { debouncedFn: T; cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debouncedFn = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      callback(...args);
      timeoutId = null;
    }, delay);
  }) as T;

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return { debouncedFn, cancel };
}
