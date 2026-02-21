"use client";

// Hook for global search: debounce, fetch, keyboard navigation, state management
// Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.3, 5.4

import { useState, useCallback, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { GlobalSearchResponse } from "@/types/global-search";
import {
  type FlatSearchItem,
  flattenResults,
  computeNextIndex,
  computePrevIndex,
  getResultUrl,
} from "@/lib/utils/global-search-utils";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export function useGlobalSearch() {
  const locale = useLocale();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flatItems: FlatSearchItem[] = flattenResults(results);

  const getActiveItem = useCallback((): FlatSearchItem | null => {
    if (activeIndex < 0 || activeIndex >= flatItems.length) return null;
    return flatItems[activeIndex];
  }, [activeIndex, flatItems]);

  // Debounced fetch — cancels previous request on new input
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (query.trim().length < MIN_QUERY_LENGTH) {
      setResults(null);
      setIsOpen(false);
      setActiveIndex(-1);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    timerRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const params = new URLSearchParams({ query: query.trim(), locale });
        const res = await fetch(`/api/search/global?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Search failed");
        const data: GlobalSearchResponse = await res.json();
        setResults(data);
        setIsOpen(true);
        setActiveIndex(-1);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResults(null);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, locale]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((i) => computeNextIndex(i, flatItems.length));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((i) => computePrevIndex(i));
          break;
        case "Enter": {
          e.preventDefault();
          const item = flatItems[activeIndex];
          if (!item) break;
          const url = getResultUrl(item);
          if (url) {
            router.push(url);
            setIsOpen(false);
            setQuery("");
          }
          break;
        }
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    },
    [isOpen, activeIndex, flatItems, locale, router]
  );

  return {
    query,
    setQuery,
    results,
    isLoading,
    isOpen,
    setIsOpen,
    activeIndex,
    setActiveIndex,
    handleKeyDown,
    getActiveItem,
    flatItems,
  };
}
