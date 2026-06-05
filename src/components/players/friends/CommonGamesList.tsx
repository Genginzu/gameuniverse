"use client";

/**
 * CommonGamesList : grille des jeux communs entre deux joueurs.
 *
 * Utilise le composant `GameCard` éditorial unique avec son overlay
 * `common` (chips genres dans le footer). Pas de markup glass legacy.
 * Pagination prev/next conservée.
 */

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { GameCard } from "@/components/games/GameCard";
import type { GameSummary } from "@/types/game";
import type { CommonGame } from "@/types/player";

interface CommonGamesListProps {
  games: CommonGame[];
  locale: string;
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
  };
  onPageChange: (page: number) => void;
}

function toGameSummary(game: CommonGame): GameSummary {
  return {
    id: game.gameId,
    slug: game.slug,
    title: game.title,
    coverImage: game.coverImage ?? undefined,
    developer: "",
    publisher: "",
    genres: [],
  };
}

export function CommonGamesList({
  games,
  locale: _locale,
  pagination,
  onPageChange,
}: CommonGamesListProps) {
  const t = useTranslations("players");

  if (games.length === 0) {
    return null;
  }

  const { currentPage, totalPages, hasNextPage } = pagination;
  const hasPreviousPage = currentPage > 1;

  return (
    <div className="space-y-4">
      <div className="editorial-library-grid">
        {games.map((game, index) => (
          <GameCard
            key={game.gameId}
            game={toGameSummary(game)}
            priority={index < 5}
            overlay={{ type: "common", genres: game.genres }}
          />
        ))}
      </div>

      {/* Pagination — only shown when there are multiple pages */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            disabled={!hasPreviousPage}
            onClick={() => onPageChange(currentPage - 1)}
            className="flex items-center gap-1 rounded-lg border border-[var(--editorial-line)] bg-[var(--editorial-bg-2)] px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon icon="lucide:chevron-left" className="h-4 w-4" />
            {t("pagination.previous")}
          </button>

          <span className="text-sm text-zinc-400">
            {t("pagination.page")} {currentPage} {t("pagination.of")} {totalPages}
          </span>

          <button
            type="button"
            disabled={!hasNextPage}
            onClick={() => onPageChange(currentPage + 1)}
            className="flex items-center gap-1 rounded-lg border border-[var(--editorial-line)] bg-[var(--editorial-bg-2)] px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("pagination.next")}
            <Icon icon="lucide:chevron-right" className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
