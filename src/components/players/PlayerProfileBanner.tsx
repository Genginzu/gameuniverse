"use client";

import { LazyImage } from "@/components/ui/lazy-image";
import { User, PenLine, Users, MessageSquare } from "lucide-react";
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
          <div className="h-full w-full bg-gradient-to-r from-indigo-600/40 via-purple-600/40 to-pink-600/40" />
        )}
        {/* Subtle bottom fade into the info section */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gray-50 to-transparent dark:from-slate-900" />
      </div>

      {/* Avatar overlapping the banner — centered, with ProgressRing */}
      <div className="relative z-10 mx-auto -mt-32 flex flex-col items-center">
        <ProgressRing
          progressPercent={xpStats?.progressPercent ?? 0}
          level={xpStats?.level ?? player.level}
          size={140}
        >
          <div className="relative h-[132px] w-[132px] overflow-hidden rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 shadow-xl">
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
                <User className="h-12 w-12 text-blue-300" />
              </div>
            )}
          </div>
        </ProgressRing>
        {/* Friend action button — centered under avatar */}
        {friendActionSlot && <div className="mt-3">{friendActionSlot}</div>}
      </div>

      {/* Info row: stats | name | social links */}
      <div className="container mx-auto px-4 pb-4 pt-2">
        <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left: name + username */}
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
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
    { value: reviewCount, label: t("posts"), icon: PenLine },
    { value: friendCount, label: t("friends"), icon: Users },
    { value: commentCount, label: t("comments"), icon: MessageSquare },
  ];

  return (
    <div className="flex gap-3">
      {counters.map((c) => (
        <div
          key={c.label}
          className="flex items-center gap-2 rounded-xl bg-white/40 px-3 py-2 backdrop-blur-sm transition-all duration-300 hover:bg-white/60 dark:bg-slate-800/40 dark:hover:bg-slate-700/50"
        >
          <c.icon className="h-4 w-4 text-purple-500 dark:text-purple-400" />
          <span className="text-sm font-bold text-gray-900 dark:text-white">{c.value}</span>
          <span className="text-xs text-gray-500 dark:text-slate-400">{c.label}</span>
        </div>
      ))}
    </div>
  );
}
