"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { useDismissableLayer } from "@/hooks/useDismissableLayer";
import { useLightboxNavigation } from "@/hooks/useLightboxNavigation";
import { useAccentPortalScope } from "@/components/shared/AccentPortalScope";
import type { GameMediaViewerItem } from "@/types/game";
import { MediaLightboxStage } from "./MediaLightboxStage";
import { MediaLightboxThumbnails } from "./MediaLightboxThumbnails";

interface MediaLightboxProps {
  items: GameMediaViewerItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

const NAV_BUTTON =
  "absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/60 text-white transition-colors hover:bg-editorial-accent sm:size-12";

/**
 * Full-screen media viewer for the game detail page. Screenshots and videos
 * share one sequence: arrows, keyboard (←/→), swipe and the thumbnail strip
 * move between items without closing. Escape, ╳ or a click on the backdrop closes.
 */
export function MediaLightbox({ items, index, onIndexChange, onClose }: MediaLightboxProps) {
  const t = useTranslations("gameDetails.editorial.mediaViewer");
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const accentScope = useAccentPortalScope();

  useEffect(() => setMounted(true), []);

  useDismissableLayer(overlayRef, {
    open: mounted,
    onDismiss: onClose,
    lockScroll: true,
    trapFocus: true,
  });

  const { previous, next, swipeHandlers } = useLightboxNavigation({
    open: mounted,
    index,
    count: items.length,
    onIndexChange,
  });

  const item = items[index];
  if (!mounted || !item) return null;

  const label = item.kind === "image" ? (item.caption ?? item.alt) : item.title;
  const hasSiblings = items.length > 1;
  const closeOnBackdrop = (event: MouseEvent) => {
    if (event.target === event.currentTarget) onClose();
  };

  return createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("label")}
      style={accentScope?.style}
      className={`fixed inset-0 z-[100] flex flex-col bg-black/95 text-white ${accentScope?.className ?? ""}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-editorial-muted shrink-0 font-mono text-sm" aria-live="polite">
          {t("counter", { index: index + 1, total: items.length })}
        </span>
        <p className="min-w-0 flex-1 truncate text-sm sm:text-base">{label}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-white/10"
        >
          <Icon icon="lucide:x" className="size-6" />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16"
        onClick={closeOnBackdrop}
        {...swipeHandlers}
      >
        <MediaLightboxStage key={`${item.kind}-${item.id}`} item={item} />
        {hasSiblings && (
          <>
            <button
              type="button"
              onClick={previous}
              aria-label={t("previous")}
              className={`${NAV_BUTTON} left-2`}
            >
              <Icon icon="lucide:chevron-left" className="size-6" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label={t("next")}
              className={`${NAV_BUTTON} right-2`}
            >
              <Icon icon="lucide:chevron-right" className="size-6" />
            </button>
          </>
        )}
      </div>

      {hasSiblings && (
        <div className="pt-3">
          <MediaLightboxThumbnails items={items} activeIndex={index} onSelect={onIndexChange} />
        </div>
      )}
    </div>,
    document.body
  );
}
