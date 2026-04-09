"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface PlayerSearchBarProps {
  onSearch: (query: string) => void;
  initialValue?: string;
  placeholder?: string;
  debounceMs?: number;
}

export function PlayerSearchBar({
  onSearch,
  initialValue = "",
  placeholder,
  debounceMs = 300,
}: PlayerSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(initialValue);

  // Debounce search to avoid too many API calls (300ms as per Requirements 3.4)
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch, debounceMs]);

  const handleClear = () => {
    setSearchQuery("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const defaultPlaceholder = placeholder || "Rechercher un joueur...";

  return (
    <div className="relative">
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
            placeholder={defaultPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 w-full rounded-2xl border-0 bg-white pl-12 pr-12 text-base text-gray-900 placeholder-gray-400 shadow-lg ring-1 ring-gray-200 transition-all duration-300 hover:shadow-xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:h-14 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:ring-gray-700"
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

        {/* Search indicator */}
        {searchQuery && (
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
                Recherche en cours pour &quot;{searchQuery}&quot;
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
