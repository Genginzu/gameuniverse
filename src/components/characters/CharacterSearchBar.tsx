"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useCharacterTranslations } from "@/hooks/useTranslations";

interface CharacterSearchBarProps {
  onSearch: (query: string) => void;
  initialValue?: string;
  debounceMs?: number;
}

export function CharacterSearchBar({
  onSearch,
  initialValue = "",
  debounceMs = 300,
}: CharacterSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const t = useCharacterTranslations();

  // Debounce search to avoid too many API calls
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

  const placeholder = t("searchPlaceholder") || "Rechercher un personnage...";

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
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 w-full rounded-2xl border-0 bg-white pl-12 pr-12 text-sm text-gray-900 placeholder-gray-400 shadow-lg ring-1 ring-gray-200 transition-all duration-300 hover:shadow-xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:h-14 sm:text-base"
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

        {/* Search suggestions or quick actions */}
        {searchQuery && (
          <div className="absolute left-0 right-0 top-full z-10 mt-2 rounded-xl bg-white shadow-lg ring-1 ring-gray-200">
            <div className="p-3">
              <div className="flex items-center text-sm text-gray-600">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                {t("searchingFor") || "Recherche en cours pour"} "{searchQuery}"
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
