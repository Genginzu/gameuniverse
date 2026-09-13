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
      className="flex w-full cursor-pointer items-center gap-3 rounded-xl p-3 text-left transition-colors duration-300 hover:bg-white/[0.05]"
      data-testid="friend-search-item"
    >
      {/* Avatar */}
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-linear-to-br from-blue-500/20 via-purple-600/20 to-purple-700/20">
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
            <Icon icon="lucide:user" className="text-editorial-accent h-4 w-4" />
          </div>
        )}
      </div>

      {/* Name */}
      <p className="truncate text-sm font-medium text-white">{friend.displayName}</p>
    </button>
  );
}
