"use client";

import { cn } from "@/lib/utils";
import type { GlobalSearchCharacterItem as CharacterItem } from "@/types/global-search";
import { Icon } from "@iconify/react";
import Image from "next/image";

interface GlobalSearchCharacterItemProps {
  item: CharacterItem;
  isActive: boolean;
}

export function GlobalSearchCharacterItem({ item, isActive }: GlobalSearchCharacterItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg px-4 py-3 transition-colors",
        isActive ? "bg-white/10" : "hover:bg-white/5"
      )}
    >
      {/* Character image */}
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white/10">
        {item.mainImage ? (
          <Image src={item.mainImage} alt={item.name} fill className="object-cover" sizes="44px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/30">
            <Icon icon="lucide:user" className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium text-white/90">{item.name}</p>
        <p className="truncate text-sm text-white/40">
          {[item.role, item.primaryGame].filter(Boolean).join(" · ")}
        </p>
      </div>
    </div>
  );
}
