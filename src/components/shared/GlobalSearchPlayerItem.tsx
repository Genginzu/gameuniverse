"use client";

import { cn } from "@/lib/utils";
import type { GlobalSearchPlayerItem as PlayerItem } from "@/types/global-search";
import Image from "next/image";

interface GlobalSearchPlayerItemProps {
  item: PlayerItem;
  isActive: boolean;
}

export function GlobalSearchPlayerItem({ item, isActive }: GlobalSearchPlayerItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg px-4 py-3 transition-colors",
        isActive ? "bg-white/10" : "hover:bg-white/5"
      )}
    >
      {/* Player avatar */}
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white/10">
        {item.avatarUrl ? (
          <Image
            src={item.avatarUrl}
            alt={item.username}
            fill
            className="object-cover"
            sizes="44px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/30">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium text-white/90">{item.username}</p>
      </div>
    </div>
  );
}
