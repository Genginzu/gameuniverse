"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Icon } from "@iconify/react";

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
}

interface SimilarGame {
  id: string;
  similarIgdbId: number;
  game?: { id: string; slug: string; title: string; coverImage: string | null } | null;
}

export function SimilarGameSearchDropdown({
  results, searching, query, onSelect, adding, t,
}: {
  results: SearchResult[]; searching: boolean; query: string; onSelect: (game: SearchResult) => void; adding: boolean; t: (key: string) => string;
}) {
  if (results.length > 0) {
    return (
      <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
        {results.map((game) => (
          <button key={game.id} type="button" disabled={adding} onClick={() => onSelect(game)} className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-gray-50 disabled:opacity-50 dark:hover:bg-gray-700/50">
            {game.coverImage ? (
              <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded border border-gray-200 dark:border-gray-600"><Image src={game.coverImage} alt="" fill className="object-cover" /></div>
            ) : (
              <div className="flex h-10 w-7 shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-700"><Icon icon="mdi:gamepad-variant" className="h-3 w-3 text-gray-400" /></div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{game.title}</p>
              <p className="truncate text-xs text-gray-400">{game.slug}</p>
            </div>
            <Icon icon="fa:plus" className="h-3 w-3 shrink-0 text-gray-400" />
          </button>
        ))}
      </div>
    );
  }

  if (!searching && query.trim().length >= 2) {
    return (
      <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 text-center text-sm text-gray-400 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        {t("similarGamesNoResults")}
      </div>
    );
  }

  return null;
}

export function SimilarGameRow({
  sg, removing, onRemove, t,
}: {
  sg: SimilarGame; removing: string | null; onRemove: (id: string) => void; t: (key: string) => string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 dark:border-gray-700/30 dark:bg-gray-900/20">
      {sg.game ? (
        <Link href={`/admin/games/${sg.game.id}/edit`} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg transition-colors hover:bg-gray-100/60 dark:hover:bg-gray-700/30">
          {sg.game.coverImage ? (
            <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700"><Image src={sg.game.coverImage} alt="" fill className="object-cover" /></div>
          ) : (
            <div className="flex h-12 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-700"><Icon icon="mdi:gamepad-variant" className="h-4 w-4 text-gray-400" /></div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{sg.game.title}</p>
            <p className="truncate text-xs text-gray-400">{sg.game.slug}</p>
          </div>
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-12 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-700"><Icon icon="mdi:gamepad-variant" className="h-4 w-4 text-gray-400" /></div>
          <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{`IGDB #${sg.similarIgdbId}`}</p>
        </div>
      )}
      <button type="button" disabled={removing === sg.id} onClick={() => onRemove(sg.id)} className="shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-900/20" aria-label={t("similarGamesRemove")}>
        {removing === sg.id ? <LoadingSpinner size="sm" /> : <Icon icon="fa:times" className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
