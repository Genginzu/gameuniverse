"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";
import type { FriendSummary } from "@/types/friendship";

interface FriendCardProps {
  friend: FriendSummary;
  locale: string;
}

export function FriendCard({ friend, locale }: FriendCardProps) {
  return (
    <Link
      href={`/${locale}/players/${friend.id}`}
      className="group block rounded-xl border border-gray-200 bg-white p-3 transition-all hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:bg-slate-800"
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
          {friend.avatarUrl ? (
            <LazyImage
              src={friend.avatarUrl}
              alt={friend.displayName}
              fill
              className="object-cover"
              sizes="40px"
              showSkeleton
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-5 w-5 text-blue-300" />
            </div>
          )}
        </div>

        {/* Name + Level */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
            {friend.displayName}
          </p>
        </div>

        {/* Level badge */}
        {friend.level > 0 && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
            {friend.level}
          </span>
        )}
      </div>
    </Link>
  );
}
