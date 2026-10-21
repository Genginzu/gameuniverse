"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { ShowcaseIgdbResult } from "@/types/home";
import { ShowcaseThumb } from "./ShowcaseThumb";

interface ShowcaseIgdbResultsProps {
  results: ShowcaseIgdbResult[];
  searching: boolean;
  failed: boolean;
  importingId: number | null;
  disabled: boolean;
  onImport: (result: ShowcaseIgdbResult) => void;
}

/** IGDB games not yet in the catalogue: one click imports the game and adds it. */
export function ShowcaseIgdbResults({
  results,
  searching,
  failed,
  importingId,
  disabled,
  onImport,
}: ShowcaseIgdbResultsProps) {
  const t = useTranslations("admin.homeShowcase.igdb");

  const status = searching ? t("searching") : failed ? t("failed") : t("empty");

  return (
    <div className="mt-3 rounded-xl border border-white/20 bg-white/60 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-800/60 dark:shadow-black/20">
      <p className="flex items-center gap-2 border-b border-white/20 px-3 py-2 text-xs text-gray-500 dark:border-slate-700/50 dark:text-gray-400">
        <Icon icon="lucide:cloud-download" className="size-3.5" aria-hidden />
        {t("title")}
      </p>
      {results.length === 0 ? (
        <p className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">{status}</p>
      ) : (
        <ul className="max-h-96 overflow-y-auto overscroll-contain">
          {results.map((result) => {
            const importing = importingId === result.igdbId;
            return (
              <li key={result.igdbId}>
                <button
                  type="button"
                  disabled={disabled || importingId !== null}
                  aria-busy={importing || undefined}
                  onClick={() => onImport(result)}
                  className="flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left transition-all duration-300 hover:bg-white/40 disabled:cursor-wait disabled:opacity-60 dark:hover:bg-slate-700/60"
                >
                  <ShowcaseThumb imageUrl={result.coverUrl} kind="game" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">
                      {result.name}
                    </span>
                    <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                      {result.releaseYear ?? result.slug}
                    </span>
                  </span>
                  {importing ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                      <Icon icon="lucide:download" className="size-4" aria-hidden />
                      {t("import")}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
