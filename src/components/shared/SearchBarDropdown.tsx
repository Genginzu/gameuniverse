"use client";

import { Icon } from "@iconify/react";
import type { SearchResultItem, HybridSearchConfig } from "./SearchBar";

interface SearchBarDropdownProps<T extends SearchResultItem> {
  isOpen: boolean;
  isLoading: boolean;
  results: T[];
  hasMore: boolean;
  importingId: string | null;
  searchQuery: string;
  minQueryLength: number;
  hybridConfig?: HybridSearchConfig<T>;
  onSelectResult: (result: T) => void;
}

export function SearchBarDropdown<T extends SearchResultItem>({
  isOpen,
  isLoading,
  results,
  hasMore,
  importingId,
  searchQuery,
  minQueryLength,
  hybridConfig,
  onSelectResult,
}: SearchBarDropdownProps<T>) {
  if (!isOpen || searchQuery.length < minQueryLength) return null;

  if (isLoading) {
    return (
      <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl bg-white shadow-lg ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
        {hybridConfig?.loadingComponent || (
          <div className="flex items-center justify-center p-4">
            <Icon icon="svg-spinners:ring-resize" className="h-5 w-5 text-blue-500" />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Loading...</span>
          </div>
        )}
      </div>
    );
  }

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

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl bg-white shadow-lg ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {results.map((result) => (
          <li key={result.id}>
            <button
              type="button"
              onClick={() => onSelectResult(result)}
              disabled={importingId === result.id}
              className="w-full text-left transition-colors hover:bg-gray-50 disabled:cursor-wait disabled:opacity-70 dark:hover:bg-gray-700"
            >
              {hybridConfig?.resultRenderer(result, importingId === result.id)}
            </button>
          </li>
        ))}
      </ul>

      {hasMore && hybridConfig?.onSeeAll && (
        <div className="border-t border-gray-100 p-2 dark:border-gray-700">
          <button
            type="button"
            onClick={hybridConfig.onSeeAll}
            className="flex w-full items-center justify-center gap-2 rounded-lg p-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
          >
            See all results
            <Icon icon="lucide:chevron-down" className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
