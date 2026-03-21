"use client";

import { Icon } from "@iconify/react";

import { LazyImage } from "@/components/ui/lazy-image";

interface FriendSearchItemProps {
  friend: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  onSelect: (friendId: string) => void;
}

export default function FriendSearchItem({ friend, onSelect }: FriendSearchItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(friend.id)}
      className="flex w-full cursor-pointer items-center gap-3 rounded-xl p-3 text-left transition-all duration-300 hover:bg-white/60 dark:hover:bg-slate-700/60"
      data-testid="friend-search-item"
    >
      {/* Avatar */}
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
        {friend.avatarUrl ? (
          <LazyImage
            src={friend.avatarUrl}
            alt={friend.displayName}
            fill
            className="object-cover"
            sizes="36px"
            showSkeleton
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon icon="lucide:user" className="h-4 w-4 text-blue-300" />
          </div>
        )}
      </div>

      {/* Name */}
      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
        {friend.displayName}
      </p>
    </button>
  );
}
