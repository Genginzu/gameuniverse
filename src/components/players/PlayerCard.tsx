"use client";

import { LazyImage } from "@/components/ui/lazy-image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { PlayerSummary } from "@/types/player";

interface PlayerCardProps {
  player: PlayerSummary;
  locale?: string;
  priority?: boolean;
}

export function PlayerCard({ player, locale = "fr", priority = false }: PlayerCardProps) {
  const t = useTranslations("players.card");
  const displayName = player.fullName || t("anonymousPlayer");

  return (
    <div className="group relative">
      <Link href={`/${locale}/players/${player.id}`}>
        <div className="relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-500/10">
          {/* Avatar section */}
          <div className="relative aspect-square bg-gradient-to-br from-blue-100 to-indigo-100">
            {player.avatarUrl ? (
              <LazyImage
                src={player.avatarUrl}
                alt={displayName}
                fill
                className="object-cover transition-all duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                showSkeleton={true}
                priority={priority}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <svg
                  className="h-20 w-20 text-blue-300 transition-transform duration-500 group-hover:scale-110"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}

            {/* Games count badge */}
            <div className="absolute right-3 top-3 z-20">
              <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-900 shadow-lg backdrop-blur-sm">
                {t("games", { count: player.gamesCount })}
              </div>
            </div>
          </div>

          {/* Info section */}
          <div className="p-4">
            <h3 className="line-clamp-1 text-base font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
              {displayName}
            </h3>
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 z-10 flex items-end rounded-2xl bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100">
            <div className="w-full p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{displayName}</span>
                <span className="flex items-center text-xs text-gray-300">
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
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  {player.gamesCount}
                </span>
              </div>
              <div className="mt-2 text-xs text-blue-400">{t("viewProfile")}</div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
