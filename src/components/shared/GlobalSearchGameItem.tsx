"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { GlobalSearchGameItem as GameItem } from "@/types/global-search";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface GlobalSearchGameItemProps {
  item: GameItem;
  isActive: boolean;
}

export function GlobalSearchGameItem({ item, isActive }: GlobalSearchGameItemProps) {
  const t = useTranslations("globalSearch");

  const sourceLabel = item.source === "local" ? t("source.local") : t("source.igdb");
  const isLocal = item.source === "local";

  return (
    <div
      className={cn("flex items-center gap-3 px-3 py-2 transition-colors", isActive && "bg-accent")}
    >
      {/* Cover image */}
      <div className="relative h-12 w-9 flex-shrink-0 overflow-hidden rounded-sm bg-muted">
        {item.coverUrl ? (
          <Image src={item.coverUrl} alt={item.title} fill className="object-cover" sizes="36px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Text content */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[item.developer, item.releaseYear].filter(Boolean).join(" · ")}
        </p>
      </div>

      {/* Source badge */}
      <Badge
        variant={isLocal ? "secondary" : "outline"}
        className={cn(
          "flex-shrink-0 text-[10px]",
          !isLocal && "border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400"
        )}
      >
        {sourceLabel}
      </Badge>
    </div>
  );
}
