"use client";

import { Input } from "@/components/ui/input";

/**
 * Variantes visuelles supportées par `SearchInputField`.
 * - `default` : style legacy bleu pâle (borders bleus, fond `bg-blue-50/50`).
 * - `editorial` : style éditorial sombre (`--editorial-bg-2`, bordure
 *   `--editorial-line`, hauteur 56px alignée sur `FilterButton`).
 */
export type SearchInputVariant = "default" | "editorial";

interface SearchInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onSubmit: () => void;
  onClear: () => void;
  placeholder: string;
  /** Variante visuelle. Default: `"default"` (legacy). */
  variant?: SearchInputVariant;
}

export function SearchInputField({
  value,
  onChange,
  onFocus,
  onSubmit,
  onClear,
  placeholder,
  variant = "default",
}: SearchInputFieldProps) {
  if (variant === "editorial") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="editorial-search-input"
      >
        <span className="editorial-search-input-icon" aria-hidden="true">
          <svg
            className="h-5 w-5"
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
        </span>

        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          className="editorial-search-input-field"
        />

        {value && (
          <button
            type="button"
            onClick={onClear}
            className="editorial-search-input-clear"
            aria-label="Clear search"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="relative"
    >
      <div className="group relative">
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
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          className="h-10 w-full rounded-xl border-2 border-blue-200 bg-blue-50/50 pr-10 pl-11 text-sm text-gray-900 placeholder-gray-500 shadow-xs transition-all duration-300 hover:border-blue-300 hover:bg-white hover:shadow-md focus:border-blue-500 focus:bg-white focus:shadow-lg focus:ring-2 focus:ring-blue-500/20 sm:h-12 sm:pr-12 sm:pl-12 sm:text-base dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:hover:border-gray-500 dark:hover:bg-gray-700 dark:focus:border-blue-500 dark:focus:bg-gray-700"
        />

        {value && (
          <button
            type="button"
            onClick={onClear}
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
    </form>
  );
}
