"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAdminFranchiseGames } from "@/hooks/useAdminFranchiseGames";
import { useAdminGameSearch } from "@/hooks/useAdminGameSearch";
import { toast } from "@/hooks/use-toast";
import type { SearchResultItem } from "@/types/search";
import { FranchiseGameSearchResults, searchResultKey } from "./FranchiseGameSearchResults";

/** Games of a franchise in the admin: search to link a game, one row per linked game. */
export function FranchiseGamesManager({ franchiseId }: { franchiseId: string }) {
  const t = useTranslations("admin.franchises.games");
  const locale = useLocale();
  const { games, loading, pendingId, addGame, removeGame } = useAdminFranchiseGames(
    franchiseId,
    locale
  );
  const [query, setQuery] = useState("");
  const { results, searching } = useAdminGameSearch(query, locale);
  const linkedIds = new Set(games.map((game) => game.id));
  const candidates = results.filter((game) => game.source === "igdb" || !linkedIds.has(game.id));

  const handle = async (action: Promise<boolean>, success: string) => {
    toast(
      (await action)
        ? { title: success, variant: "success" }
        : { title: t("error"), variant: "destructive" }
    );
  };

  const handleSelect = async (game: SearchResultItem) => {
    const target =
      game.source === "igdb" && game.igdbId ? { igdbId: game.igdbId } : { gameId: game.id };
    await handle(addGame(searchResultKey(game), target), t("added", { title: game.title }));
    setQuery("");
  };

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200/60 bg-white/60 p-4 shadow-xs backdrop-blur-xl md:p-6 dark:border-gray-700/40 dark:bg-gray-800/60">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {t("title")} <span className="font-normal text-gray-400">({games.length})</span>
      </h2>

      <div className="relative">
        <Icon
          icon="mdi:magnify"
          className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="pl-9 text-base"
        />
        {searching && (
          <LoadingSpinner size="sm" className="absolute top-1/2 right-3 -translate-y-1/2" />
        )}
      </div>

      {query.trim().length >= 2 && (
        <FranchiseGameSearchResults
          results={candidates}
          searching={searching}
          pendingKey={pendingId}
          onSelect={handleSelect}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <LoadingSpinner size="md" />
        </div>
      ) : games.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">{t("empty")}</p>
      ) : (
        <ul className="space-y-2">
          {games.map((game) => (
            <li
              key={game.id}
              className="flex items-center gap-3 rounded-xl border border-gray-200/60 bg-white/40 p-2 dark:border-gray-700/50 dark:bg-gray-800/40"
            >
              <Cover src={game.coverImage} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">
                  {game.title}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {game.releaseDate ? new Date(game.releaseDate).getFullYear() : t("noDate")}
                </span>
              </span>
              <button
                type="button"
                disabled={pendingId === game.id}
                onClick={() => handle(removeGame(game.id), t("removed", { title: game.title }))}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-red-500 transition-all duration-300 hover:bg-red-500/10 disabled:opacity-50"
                aria-label={t("remove", { title: game.title })}
              >
                <Icon icon="mdi:link-variant-off" className="h-5 w-5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Cover({ src }: { src: string | null }) {
  return (
    <span className="relative block h-12 w-9 shrink-0 overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
      {src && <Image src={src} alt="" fill sizes="36px" className="object-cover" />}
    </span>
  );
}
