"use client";

import { LazyImage } from "@/components/ui/lazy-image";
import { User } from "lucide-react";
import { PlayerProfileSocialLinks } from "./PlayerProfileSocialLinks";
import type { PlayerDetails } from "@/types/player";
import type { ReactNode } from "react";

interface PlayerProfileBannerProps {
  player: PlayerDetails;
  displayName: string;
  reviewCount: number;
  friendCount: number;
  commentCount: number;
  friendActionSlot?: ReactNode;
}

export function PlayerProfileBanner({
  player,
  displayName,
  reviewCount,
  friendCount,
  commentCount,
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

      {/* Avatar overlapping the banner — centered, with button below */}
      <div className="relative z-10 mx-auto -mt-32 flex flex-col items-center">
        <div className="relative">
          <div className="relative h-28 w-28 overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-br from-blue-100 to-indigo-100 shadow-xl dark:border-slate-800 md:h-32 md:w-32">
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
          {/* Level badge */}
          {player.level > 0 && (
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-bold text-white shadow">
              {player.level}
            </span>
          )}
        </div>
        {/* Friend action button — centered under avatar */}
        {friendActionSlot && <div className="mt-3">{friendActionSlot}</div>}
      </div>

      {/* Info row: stats | name | social links */}
      <div className="container mx-auto px-4 pb-4 pt-2">
        <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left: counters */}
          <ProfileCounters
            reviewCount={reviewCount}
            friendCount={friendCount}
            commentCount={commentCount}
          />

          {/* Center: name + username */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
              {displayName}
            </h1>
            {player.fullName && (
              <p className="text-sm text-gray-500 dark:text-slate-400">@{player.fullName}</p>
            )}
          </div>

          {/* Right: social links */}
          <PlayerProfileSocialLinks socialLinks={player.socialLinks} />
        </div>
      </div>
    </div>
  );
}

/** Small stat counter block (posts / friends / comments) */
function ProfileCounters({
  reviewCount,
  friendCount,
  commentCount,
}: {
  reviewCount: number;
  friendCount: number;
  commentCount: number;
}) {
  const counters = [
    { value: reviewCount, label: "POSTS" },
    { value: friendCount, label: "FRIEND" },
    { value: commentCount, label: "COMMENTS" },
  ];

  return (
    <div className="flex gap-6">
      {counters.map((c) => (
        <div key={c.label} className="text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-white">{c.value}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
            {c.label}
          </p>
        </div>
      ))}
    </div>
  );
}
