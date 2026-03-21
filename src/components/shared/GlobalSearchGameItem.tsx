"use client";

import { cn } from "@/lib/utils";
import type { GlobalSearchGameItem as GameItem } from "@/types/global-search";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface GlobalSearchGameItemProps {
  item: GameItem;
  isActive: boolean;
  isImporting?: boolean;
}

export function GlobalSearchGameItem({ item, isActive, isImporting }: GlobalSearchGameItemProps) {
  const _t = useTranslations("globalSearch");

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg transition-all",
        isActive && "ring-2 ring-white/60",
        isImporting && "cursor-wait opacity-60"
      )}
    >
      {/* Cover image */}
      <div className="relative aspect-3/4 w-full overflow-hidden rounded-lg bg-white/5">
        {item.coverUrl ? (
          <Image
            src={item.coverUrl}
            alt={item.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/20">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
          </div>
        )}

        {/* IGDB badge */}
        {item.source === "igdb" && (
          <span className="absolute top-1 right-1 rounded bg-blue-600/80 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase backdrop-blur-xs">
            IGDB
          </span>
        )}

        {/* Importing overlay */}
        {isImporting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Icon icon="lucide:loader-2" className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Title + release year below cover */}
      <div className="mt-2.5 px-0.5">
        <p className="truncate text-sm font-medium text-white/90">{item.title}</p>
        {item.releaseYear && <p className="truncate text-xs text-white/40">{item.releaseYear}</p>}
      </div>
    </div>
  );
}
