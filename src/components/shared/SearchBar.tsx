"use client";

import { useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { Icon } from "@iconify/react";
import { Input } from "@/components/ui/input";
import { SearchBarDropdown } from "./SearchBarDropdown";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useEscapeKey } from "@/hooks/useEscapeKey";

export interface SearchResultItem {
  id: string;
  title: string;
  [key: string]: unknown;
}

export interface HybridSearchConfig<T extends SearchResultItem> {
  enabled: true;
  searchFn: (query: string) => Promise<{ results: T[]; hasMore: boolean }>;
  onSelect: (result: T) => void;
  resultRenderer: (result: T, isImporting: boolean) => ReactNode;
  onSeeAll?: () => void;
  minQueryLength?: number;
  loadingComponent?: ReactNode;
  noResultsComponent?: ReactNode;
}

export interface SearchBarProps<T extends SearchResultItem = SearchResultItem> {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  hybridConfig?: HybridSearchConfig<T>;
  initialValue?: string;
  className?: string;
  showSearchIndicator?: boolean;
  searchIndicatorText?: string;
}

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
  const [results, setResults] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isHybridMode = hybridConfig?.enabled ?? false;
  const minQueryLength = hybridConfig?.minQueryLength ?? 2;

  useEffect(() => {
    const timer = setTimeout(() => onSearch(searchQuery), debounceMs);
    return () => clearTimeout(timer);
  }, [searchQuery, onSearch, debounceMs]);

  useEffect(() => {
    if (!isHybridMode || !hybridConfig) return;
    if (abortControllerRef.current) abortControllerRef.current.abort();
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
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [searchQuery, debounceMs, isHybridMode, hybridConfig, minQueryLength]);

  const closeDropdown = useCallback(() => setIsOpen(false), []);

  useClickOutside(containerRef, isHybridMode ? closeDropdown : () => {});
  useEscapeKey(isHybridMode ? closeDropdown : () => {});

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

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="group relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Icon
              icon="mdi:magnify"
              className="size-5 text-gray-400 transition-colors group-focus-within:text-blue-500"
            />
          </div>
          <Input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => isHybridMode && searchQuery.length >= minQueryLength && setIsOpen(true)}
            className="h-12 w-full rounded-2xl border-0 bg-white pr-12 pl-12 text-sm text-gray-900 placeholder-gray-400 shadow-lg ring-1 ring-gray-200 transition-all duration-300 hover:shadow-xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:h-14 sm:text-base dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:ring-gray-700"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 transition-all duration-200 hover:scale-110 hover:text-red-500"
            >
              <div className="rounded-full bg-gray-100 p-1 transition-colors hover:bg-red-100 dark:bg-gray-700 dark:hover:bg-red-900/30">
                <Icon icon="mdi:close" className="size-4" />
              </div>
            </button>
          )}
        </div>
        {showSearchIndicator && searchQuery && !isHybridMode && (
          <div className="absolute top-full right-0 left-0 z-10 mt-2 rounded-xl bg-white shadow-lg ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
            <div className="p-3">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <Icon icon="mdi:flash" className="mr-2 size-4" />
                {searchIndicatorText} &quot;{searchQuery}&quot;
              </div>
            </div>
          </div>
        )}
      </form>
      {isHybridMode && (
        <SearchBarDropdown
          isOpen={isOpen}
          isLoading={isLoading}
          results={results}
          hasMore={hasMore}
          importingId={importingId}
          searchQuery={searchQuery}
          minQueryLength={minQueryLength}
          hybridConfig={hybridConfig}
          onSelectResult={handleSelectResult}
        />
      )}
    </div>
  );
}

export function shouldTriggerSearch(query: string, minLength: number = 2): boolean {
  return query.length >= minLength;
}

export function createDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): { debouncedFn: T; cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const debouncedFn = ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
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
