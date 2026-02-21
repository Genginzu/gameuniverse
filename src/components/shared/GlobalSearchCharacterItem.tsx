"use client";

import { cn } from "@/lib/utils";
import type { GlobalSearchCharacterItem as CharacterItem } from "@/types/global-search";
import Image from "next/image";

interface GlobalSearchCharacterItemProps {
  item: CharacterItem;
  isActive: boolean;
}

export function GlobalSearchCharacterItem({ item, isActive }: GlobalSearchCharacterItemProps) {
  return (
    <div
      className={cn("flex items-center gap-3 px-3 py-2 transition-colors", isActive && "bg-accent")}
    >
      {/* Character image */}
      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-muted">
        {item.mainImage ? (
          <Image src={item.mainImage} alt={item.name} fill className="object-cover" sizes="40px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
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

      {/* Text content */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[item.role, item.primaryGame].filter(Boolean).join(" · ")}
        </p>
      </div>
    </div>
  );
}
