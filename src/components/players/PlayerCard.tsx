"use client";

import { LazyImage } from "@/components/ui/lazy-image";
import { PlayerCardSocialLinks } from "./PlayerCardSocialLinks";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
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
    <Link href={`/${locale}/players/${player.id}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl dark:bg-gray-800">
        {/* Banner */}
        {player.bannerUrl ? (
          <div className="relative h-20">
            <LazyImage
              src={player.bannerUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 300px"
              showSkeleton
              priority={priority}
            />
          </div>
        ) : (
          <div className="h-20 bg-linear-to-r from-[#615dfa] via-[#5b36d4] to-[#7c5cfc]" />
        )}

        {/* Avatar with level badge */}
        <div className="relative z-10 -mt-12 flex justify-center">
          <div className="relative">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border-4 border-white bg-linear-to-br from-blue-100 to-indigo-100 shadow-lg dark:border-gray-800 dark:from-blue-900/30 dark:to-indigo-900/30">
              {player.avatarUrl ? (
                <LazyImage
                  src={player.avatarUrl}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="80px"
                  showSkeleton
                  priority={priority}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Icon icon="lucide:user" className="h-8 w-8 text-blue-300" />
                </div>
              )}
            </div>
            {/* Level badge */}
            {player.level > 0 && (
              <span className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-gray-800">
                {player.level}
              </span>
            )}
          </div>
        </div>

        {/* Name */}
        <div className="px-4 pt-3 text-center">
          <h3 className="line-clamp-1 text-sm font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
            {displayName}
          </h3>
          {player.fullName && <p className="mt-0.5 text-xs text-gray-400">@{player.fullName}</p>}
        </div>

        {/* Stats row */}
        <PlayerCardStats gamesCount={player.gamesCount} reviewCount={player.reviewCount} t={t} />

        {/* Social links */}
        <div className="flex justify-center px-4 pb-4">
          <PlayerCardSocialLinks socialLinks={player.socialLinks} />
        </div>
      </div>
    </Link>
  );
}

/** Stat counters row (games + reviews) */
function PlayerCardStats({
  gamesCount,
  reviewCount,
  t,
}: {
  gamesCount: number;
  reviewCount: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, values?: any) => string;
}) {
  const stats = [
    { value: reviewCount, label: t("reviews") },
    { value: gamesCount, label: t("gamesLabel") },
  ];

  return (
    <div className="my-3 flex justify-center gap-6 border-y border-gray-100 py-3 dark:border-gray-700">
      {stats.map((s) => (
        <div key={s.label} className="text-center">
          <p className="text-sm font-bold text-gray-900 dark:text-white">{s.value}</p>
          <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}
