"use client";

import { useTranslations } from "next-intl";
import { LazyImage } from "@/components/ui/lazy-image";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Gamepad2 } from "lucide-react";
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

/**
 * Grid of common games between two players.
 * Displays cover image, title, and genres for each game.
 * Each game links to its detail page. Includes prev/next pagination.
 *
 * Requirements: 3.1, 3.2, 3.4
 */
export function CommonGamesList({ games, locale, pagination, onPageChange }: CommonGamesListProps) {
  const t = useTranslations("players");

  if (games.length === 0) {
    return null;
  }

  const { currentPage, totalPages, hasNextPage } = pagination;
  const hasPreviousPage = currentPage > 1;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {games.map((game) => (
          <Link
            key={game.gameId}
            href={`/${locale}/games/${game.slug}`}
            className="group relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 transition-all hover:scale-[1.02] hover:border-slate-600 hover:shadow-lg hover:shadow-indigo-500/10"
          >
            {/* Cover image */}
            <div className="relative aspect-3/4">
              {game.coverImage ? (
                <LazyImage
                  src={game.coverImage}
                  alt={game.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                  showSkeleton={true}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-700">
                  <Gamepad2 className="h-12 w-12 text-slate-500" />
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />

              {/* Game info */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h4 className="line-clamp-2 text-sm font-semibold text-white">{game.title}</h4>
                {game.genres.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {game.genres.slice(0, 2).map((genre) => (
                      <Badge
                        key={genre}
                        variant="outline"
                        className="border-slate-500/30 bg-slate-700/50 text-[10px] text-slate-300"
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination — only shown when there are multiple pages */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            disabled={!hasPreviousPage}
            onClick={() => onPageChange(currentPage - 1)}
            className="flex items-center gap-1 rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("pagination.previous")}
          </button>

          <span className="text-sm text-slate-400">
            {t("pagination.page")} {currentPage} {t("pagination.of")} {totalPages}
          </span>

          <button
            type="button"
            disabled={!hasNextPage}
            onClick={() => onPageChange(currentPage + 1)}
            className="flex items-center gap-1 rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("pagination.next")}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
