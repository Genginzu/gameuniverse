"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { LazyImage } from "@/components/ui/lazy-image";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { PlayerLibraryGame } from "@/types/player";
import { Icon } from "@iconify/react";

interface PlayerLibraryGridProps {
  games: PlayerLibraryGame[];
  locale: string;
}

export function PlayerLibraryGrid({ games, locale }: PlayerLibraryGridProps) {
  const t = useTranslations("players");

  // Status badge colors and labels
  const getStatusConfig = (status: PlayerLibraryGame["status"]) => {
    const configs = {
      owned: {
        label: t("library.status.owned"),
        className: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      },
      wishlist: {
        label: t("library.status.wishlist"),
        className: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      },
      completed: {
        label: t("library.status.completed"),
        className: "bg-green-500/20 text-green-300 border-green-500/30",
      },
      playing: {
        label: t("library.status.playing"),
        className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      },
    };
    return configs[status] || configs.owned;
  };

  // Sort games by addedAt date (most recent first) - Requirements 6.1, 6.2
  const sortedGames = useMemo(
    () => [...games].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()),
    [games]
  );

  // Empty state - Requirements 6.3
  if (sortedGames.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/40 py-16 text-center shadow-lg shadow-black/5 backdrop-blur-xl transition-all duration-300 dark:border-slate-700/50 dark:bg-slate-800/50 dark:shadow-black/20">
        <div className="mb-6 rounded-full bg-linear-to-br from-cyan-100 to-violet-100 p-6 dark:from-cyan-900/30 dark:to-violet-900/30">
          <Icon icon="lucide:gamepad-2" className="h-12 w-12 text-cyan-500 dark:text-cyan-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          {t("library.empty")}
        </h3>
        <p className="max-w-md px-4 text-sm text-gray-500 dark:text-slate-400">
          {t("library.emptyDescription")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {sortedGames.map((game) => {
        const statusConfig = getStatusConfig(game.status);

        return (
          <Link
            key={game.id}
            href={`/${locale}/games/${game.slug}`}
            className="group relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 transition-all hover:scale-[1.02] hover:border-slate-600 hover:shadow-lg hover:shadow-blue-500/10"
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
                  <Icon icon="lucide:gamepad-2" className="h-12 w-12 text-slate-500" />
                </div>
              )}

              {/* Status badge */}
              <div className="absolute top-2 left-2">
                <Badge
                  variant="outline"
                  className={`text-xs font-medium ${statusConfig.className}`}
                >
                  {statusConfig.label}
                </Badge>
              </div>

              {/* Rating badge (if available) */}
              {game.rating !== null && (
                <div className="absolute top-2 right-2">
                  <div className="flex items-center rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-yellow-400 backdrop-blur-xs">
                    <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {game.rating}
                  </div>
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />

              {/* Game info */}
              <div className="absolute right-0 bottom-0 left-0 p-3">
                <h4 className="line-clamp-2 text-sm font-semibold text-white">{game.title}</h4>
                {game.playTimeHours > 0 && (
                  <p className="mt-1 flex items-center text-xs text-slate-300">
                    <svg
                      className="mr-1 h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {game.playTimeHours}h
                  </p>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
