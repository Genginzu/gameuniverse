"use client";

import { SearchResultItem } from "@/types/search";
import { LazyImage } from "@/components/ui/lazy-image";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

interface SearchResultsDropdownProps {
  results: SearchResultItem[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasMore: boolean;
  onSelectGame: (item: SearchResultItem) => void;
  onSeeAll: () => void;
  onClose: () => void;
  importingId?: string | null;
}

export function SearchResultsDropdown({
  results,
  isLoading,
  isLoadingMore = false,
  hasMore,
  onSelectGame,
  onSeeAll,
  onClose,
  importingId,
}: SearchResultsDropdownProps) {
  const t = useTranslations("search");

  // Loading state
  if (isLoading) {
    return (
      <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl bg-white shadow-lg ring-1 ring-gray-200">
        <div className="flex items-center justify-center p-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="ml-2 text-sm text-gray-600">{t("loading")}</span>
        </div>
      </div>
    );
  }

  // No results state
  if (results.length === 0) {
    return (
      <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl bg-white shadow-lg ring-1 ring-gray-200">
        <div className="p-4 text-center text-sm text-gray-500">{t("noResults")}</div>
      </div>
    );
  }

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl bg-white shadow-lg ring-1 ring-gray-200">
      <ul className="divide-y divide-gray-100">
        {results.map((item) => {
          const isImporting = importingId === item.id;

          return (
            <li key={`${item.source}-${item.id}`}>
              <button
                type="button"
                onClick={() => !isImporting && onSelectGame(item)}
                disabled={isImporting}
                className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-gray-50 disabled:cursor-wait disabled:opacity-70"
              >
                {/* Cover image */}
                <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  <LazyImage
                    src={item.coverUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>

                {/* Game info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate text-sm font-medium text-gray-900">{item.title}</h4>
                    {/* Source indicator */}
                    <Badge
                      variant={item.source === "local" ? "default" : "secondary"}
                      className={`flex-shrink-0 text-xs ${
                        item.source === "local"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {t(`source.${item.source}`)}
                    </Badge>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    {item.developer && <span className="truncate">{item.developer}</span>}
                    {item.developer && item.releaseYear && <span className="text-gray-300">•</span>}
                    {item.releaseYear && <span>{item.releaseYear}</span>}
                  </div>
                </div>

                {/* Loading indicator for import */}
                {isImporting && (
                  <div className="flex items-center gap-2 text-xs text-blue-600">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    <span>{t("importing")}</span>
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* See all results link */}
      {hasMore && (
        <div className="border-t border-gray-100 p-2">
          <button
            type="button"
            onClick={onSeeAll}
            disabled={isLoadingMore}
            className="flex w-full items-center justify-center gap-2 rounded-lg p-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-wait disabled:opacity-70"
          >
            {isLoadingMore ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                {t("loading")}
              </>
            ) : (
              <>
                {t("seeAll")}
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
