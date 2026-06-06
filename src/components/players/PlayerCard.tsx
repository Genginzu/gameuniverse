"use client";

import { LazyImage } from "@/components/ui/lazy-image";
import { PlayerCardSocialLinks } from "./PlayerCardSocialLinks";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { PlayerSummary } from "@/types/player";

interface PlayerCardProps {
  player: PlayerSummary;
  locale?: string;
  priority?: boolean;
}

export function PlayerCard({ player, locale: _locale = "fr", priority = false }: PlayerCardProps) {
  const t = useTranslations("players.card");
  const displayName = player.fullName || t("anonymousPlayer");

  return (
    <Link href={`/players/${player.id}`} className="group block">
      <div className="border-editorial-line bg-editorial-2 hover:border-editorial-accent/50 relative overflow-hidden rounded-2xl border shadow-md transition-all duration-300 hover:scale-[1.02]">
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
          <div className="from-editorial-accent/30 to-editorial-accent/5 h-20 bg-gradient-to-r" />
        )}

        {/* Avatar with level badge */}
        <div className="relative z-10 -mt-12 flex justify-center">
          <div className="relative">
            <div className="border-editorial-bg bg-editorial-3 h-20 w-20 overflow-hidden rounded-2xl border-4 shadow-lg">
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
                  <Icon icon="lucide:user" className="text-editorial-muted h-8 w-8" />
                </div>
              )}
            </div>
            {/* Level badge */}
            {player.level > 0 && (
              <span className="bg-editorial-accent ring-editorial-bg absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ring-2">
                {player.level}
              </span>
            )}
          </div>
        </div>

        {/* Name */}
        <div className="px-4 pt-3 text-center">
          <h3 className="group-hover:text-editorial-accent line-clamp-1 text-sm font-semibold text-white">
            {displayName}
          </h3>
          {player.fullName && (
            <p className="text-editorial-muted mt-0.5 text-xs">@{player.fullName}</p>
          )}
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
    <div className="border-editorial-line my-3 flex justify-center gap-6 border-y py-3">
      {stats.map((s) => (
        <div key={s.label} className="text-center">
          <p className="text-sm font-bold text-white">{s.value}</p>
          <p className="text-editorial-muted text-[10px] font-semibold tracking-wider uppercase">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}
