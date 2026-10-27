"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { AppImage } from "@/components/ui/app-image";
import { cn } from "@/lib/utils";
import type { GameMediaViewerItem } from "@/types/game";

interface MediaLightboxThumbnailsProps {
  items: GameMediaViewerItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

function thumbnailOf(item: GameMediaViewerItem): string | undefined {
  return item.kind === "image" ? item.url : item.thumbnailUrl;
}

/** Horizontal strip of every viewer item; the active one is kept in view. */
export function MediaLightboxThumbnails({ items, activeIndex, onSelect }: MediaLightboxThumbnailsProps) {
  const t = useTranslations("gameDetails.editorial.mediaViewer");
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView?.({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [activeIndex]);

  return (
    <div className="editorial-scrollbar flex gap-2 overflow-x-auto px-4 pb-4 sm:justify-center">
      {items.map((item, index) => {
        const isActive = index === activeIndex;
        const thumb = thumbnailOf(item);
        return (
          <button
            key={`${item.kind}-${item.id}`}
            ref={isActive ? activeRef : undefined}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={t("goTo", { index: index + 1, total: items.length })}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "relative h-12 w-20 shrink-0 overflow-hidden rounded-md border-2 bg-editorial-3 transition-opacity sm:h-14 sm:w-24",
              isActive ? "border-editorial-accent opacity-100" : "border-transparent opacity-50 hover:opacity-90"
            )}
          >
            {thumb && <AppImage src={thumb} alt="" fill sizes="96px" className="object-cover" />}
            {item.kind === "video" && (
              <span className="absolute inset-0 grid place-items-center bg-black/30 text-white" aria-hidden="true">
                <Icon icon="lucide:play" className="size-4 fill-current" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
