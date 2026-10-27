"use client";

import { AppImage } from "@/components/ui/app-image";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { SearchResultItem } from "@/types/search";

interface FranchiseGameSearchResultsProps {
  results: SearchResultItem[];
  searching: boolean;
  pendingKey: string | null;
  onSelect: (game: SearchResultItem) => void;
}

/** Stable key of a search result: local id, or `igdb-<id>` for a game not imported yet. */
export const searchResultKey = (game: SearchResultItem) =>
  game.source === "igdb" ? `igdb-${game.igdbId}` : game.id;

/** Local and IGDB search results of the franchise games manager; IGDB games are imported on click. */
export function FranchiseGameSearchResults({
  results,
  searching,
  pendingKey,
  onSelect,
}: FranchiseGameSearchResultsProps) {
  const t = useTranslations("admin.franchises.games");

  return (
    <ul className="max-h-80 overflow-y-auto rounded-xl border border-gray-200/60 dark:border-gray-700/50">
      {results.map((game) => {
        const key = searchResultKey(game);
        const pending = pendingKey === key;
        return (
          <li key={key}>
            <button
              type="button"
              disabled={pendingKey !== null}
              onClick={() => onSelect(game)}
              className="flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100/60 disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-700/60"
            >
              <span className="relative block h-12 w-9 shrink-0 overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
                {game.coverUrl && (
                  <AppImage src={game.coverUrl} alt="" fill sizes="36px" className="object-cover" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{game.title}</span>
                {game.releaseYear && (
                  <span className="text-gray-500 dark:text-gray-400">{game.releaseYear}</span>
                )}
              </span>
              {game.source === "igdb" && (
                <span className="border-palette-primary-500/40 text-palette-primary-500 shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold">
                  {pending ? t("importing") : "IGDB"}
                </span>
              )}
              {pending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Icon icon="mdi:plus" className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
              )}
            </button>
          </li>
        );
      })}
      {!searching && results.length === 0 && (
        <li className="px-4 py-3 text-sm text-gray-400">{t("noResults")}</li>
      )}
    </ul>
  );
}
