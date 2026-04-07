"use client";

import { LazyImage } from "@/components/ui/lazy-image";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { PlayerProfileSocialLinks } from "./PlayerProfileSocialLinks";
import { ProgressRing } from "./ProgressRing";
import type { PlayerDetails } from "@/types/player";
import type { PlayerXpStats } from "@/types/achievement";
import type { ReactNode } from "react";

interface PlayerProfileBannerProps {
  player: PlayerDetails;
  displayName: string;
  reviewCount: number;
  friendCount: number;
  commentCount: number;
  xpStats?: PlayerXpStats | null;
  friendActionSlot?: ReactNode;
}

export function PlayerProfileBanner({
  player,
  displayName,
  reviewCount,
  friendCount,
  commentCount,
  xpStats,
  friendActionSlot,
}: PlayerProfileBannerProps) {
  return (
    <div className="relative pt-6">
      {/* Banner image — 90% width, centered with rounded corners */}
      <div className="relative mx-auto h-64 w-[80%] overflow-hidden rounded-2xl md:h-80">
        {player.bannerUrl ? (
          <LazyImage
            src={player.bannerUrl}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
            showSkeleton={true}
          />
        ) : (
          <div className="h-full w-full bg-linear-to-r from-indigo-600/40 via-purple-600/40 to-pink-600/40" />
        )}
      </div>

      {/* Avatar overlapping the banner — centered, with ProgressRing */}
      <div className="relative z-10 mx-auto -mt-32 flex flex-col items-center">
        <ProgressRing
          progressPercent={xpStats?.progressPercent ?? 0}
          level={xpStats?.level ?? player.level}
          size={120}
        >
          <div className="relative h-[112px] w-[112px] overflow-hidden rounded-xl bg-linear-to-br from-blue-100 to-indigo-100 shadow-xl">
            {player.avatarUrl ? (
              <LazyImage
                src={player.avatarUrl}
                alt={displayName}
                fill
                className="object-cover"
                sizes="128px"
                priority
                showSkeleton={true}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Icon icon="lucide:user" className="h-12 w-12 text-blue-300" />
              </div>
            )}
          </div>
        </ProgressRing>
        {/* Friend action button — centered under avatar */}
        {friendActionSlot && <div className="mt-3">{friendActionSlot}</div>}
      </div>

      {/* Info row: stats | name | social links */}
      <div className="container mx-auto px-4 pt-2 pb-4">
        <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left: name + username */}
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
              {displayName}
            </h1>
            {player.fullName && (
              <p className="text-sm text-gray-500 dark:text-slate-400">@{player.fullName}</p>
            )}
          </div>

          {/* Center: counters */}
          <ProfileCounters
            reviewCount={reviewCount}
            friendCount={friendCount}
            commentCount={commentCount}
          />

          {/* Right: social links */}
          <PlayerProfileSocialLinks socialLinks={player.socialLinks} />
        </div>
      </div>
    </div>
  );
}

/** Glassmorphism stat counters with icons */
function ProfileCounters({
  reviewCount,
  friendCount,
  commentCount,
}: {
  reviewCount: number;
  friendCount: number;
  commentCount: number;
}) {
  const t = useTranslations("players.details.counters");

  const counters = [
    { value: reviewCount, label: t("posts"), icon: "lucide:pen-line" },
    { value: friendCount, label: t("friends"), icon: "lucide:users" },
    { value: commentCount, label: t("comments"), icon: "lucide:message-square" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
      {counters.map((c) => (
        <div
          key={c.label}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-white/40 px-2 py-2 backdrop-blur-xs transition-all duration-300 hover:bg-white/60 sm:gap-2 sm:px-3 dark:bg-slate-800/40 dark:hover:bg-slate-700/50"
        >
          <Icon icon={c.icon} className="h-4 w-4 text-purple-500 sm:h-5 sm:w-5 dark:text-purple-400" />
          <span className="text-sm font-bold text-gray-900 sm:text-base dark:text-white">{c.value}</span>
          <span className="hidden text-sm text-gray-500 sm:inline dark:text-slate-400">{c.label}</span>
        </div>
      ))}
    </div>
  );
}
