"use client";

import type { UIEvent } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { HomeShowcaseKind, ShowcaseSearchResult } from "@/types/home";
import { ShowcaseThumb } from "./ShowcaseThumb";

/** Distance to the bottom (px) at which the next page is requested. */
const LOAD_MORE_THRESHOLD = 120;

interface ShowcaseSearchResultsProps {
  kind: HomeShowcaseKind;
  results: ShowcaseSearchResult[];
  totalCount: number;
  searching: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onSelect: (result: ShowcaseSearchResult) => void;
}

export function ShowcaseSearchResults({
  kind,
  results,
  totalCount,
  searching,
  hasMore,
  loadingMore,
  onLoadMore,
  onSelect,
}: ShowcaseSearchResultsProps) {
  const t = useTranslations("admin.homeShowcase");

  const handleScroll = (event: UIEvent<HTMLUListElement>) => {
    const list = event.currentTarget;
    if (list.scrollHeight - list.scrollTop - list.clientHeight < LOAD_MORE_THRESHOLD) onLoadMore();
  };

  if (results.length === 0) {
    return (
      <p className="mt-2 rounded-xl border border-white/20 bg-white/60 p-3 text-center text-sm text-gray-500 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-800/60 dark:text-gray-400">
        {searching ? t("searching") : t("noResults")}
      </p>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-white/20 bg-white/60 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-800/60 dark:shadow-black/20">
      <p className="border-b border-white/20 px-3 py-2 text-xs text-gray-500 dark:border-slate-700/50 dark:text-gray-400">
        {t("resultsCount", { count: totalCount })}
      </p>
      <ul className="max-h-96 overflow-y-auto overscroll-contain" onScroll={handleScroll}>
        {results.map((result) => (
          <li key={result.id}>
            <button
              type="button"
              onClick={() => onSelect(result)}
              className="flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left transition-all duration-300 hover:bg-white/40 dark:hover:bg-slate-700/60"
            >
              <ShowcaseThumb imageUrl={result.imageUrl} kind={kind} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">
                  {result.name}
                </span>
                <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                  {result.subtitle ?? result.slug}
                </span>
              </span>
              <Icon icon="lucide:plus" className="size-4 shrink-0 text-gray-400" aria-hidden />
            </button>
          </li>
        ))}
        {hasMore && (
          <li className="flex justify-center p-3">
            {loadingMore ? (
              <LoadingSpinner size="sm" />
            ) : (
              <button
                type="button"
                onClick={onLoadMore}
                className="min-h-11 rounded-xl px-4 text-sm font-medium text-gray-600 transition-all duration-300 hover:bg-white/40 dark:text-gray-300 dark:hover:bg-slate-700/60"
              >
                {t("loadMore")}
              </button>
            )}
          </li>
        )}
      </ul>
    </div>
  );
}
