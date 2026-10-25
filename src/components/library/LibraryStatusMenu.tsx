"use client";

/**
 * LibraryStatusMenu : menu to change the status of a library game
 * (owned / playing / completed / wishlist) or remove it from the library.
 * The caller renders the trigger; the menu closes on Escape, on a pointer
 * down outside, and after a choice.
 */

import { useRef, useState, type ReactNode } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { useDismissableLayer } from "@/hooks/useDismissableLayer";
import { LIBRARY_STATUSES } from "@/lib/validations/library";
import type { LibraryStatus } from "@/types/library";

export const LIBRARY_STATUS_ICONS: Record<LibraryStatus, string> = {
  owned: "lucide:package",
  playing: "lucide:gamepad-2",
  completed: "lucide:trophy",
  wishlist: "lucide:star",
};

export interface LibraryStatusTriggerProps {
  open: boolean;
  onClick: () => void;
  "aria-haspopup": "menu";
  "aria-expanded": boolean;
}

interface LibraryStatusMenuProps {
  status?: LibraryStatus;
  onSelect: (status: LibraryStatus) => void;
  onRemove: () => void;
  renderTrigger: (props: LibraryStatusTriggerProps) => ReactNode;
  /** Positions the panel relative to the trigger wrapper. */
  panelClassName?: string;
  className?: string;
}

const ITEM =
  "flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition focus-visible:bg-white/[0.06] focus-visible:outline-none";

export function LibraryStatusMenu({
  status,
  onSelect,
  onRemove,
  renderTrigger,
  panelClassName = "top-[calc(100%+0.5rem)] left-0",
  className = "relative",
}: LibraryStatusMenuProps) {
  const t = useTranslations("libraryStatus");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useDismissableLayer(containerRef, { open, onDismiss: () => setOpen(false) });

  const choose = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div ref={containerRef} className={className}>
      {renderTrigger({
        open,
        onClick: () => setOpen((value) => !value),
        "aria-haspopup": "menu",
        "aria-expanded": open,
      })}

      {open && (
        <div
          role="menu"
          aria-label={t("menuTitle")}
          className={`bg-editorial-2 border-editorial-line absolute z-30 w-60 overflow-hidden rounded-xl border shadow-[0_12px_32px_rgba(0,0,0,0.45)] ${panelClassName}`}
        >
          {LIBRARY_STATUSES.map((option) => {
            const active = option === status;
            return (
              <button
                key={option}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => choose(() => onSelect(option))}
                className={`${ITEM} ${
                  active
                    ? "text-editorial-accent bg-editorial-accent/10"
                    : "text-editorial-muted hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon icon={LIBRARY_STATUS_ICONS[option]} className="size-4 shrink-0" aria-hidden />
                <span className="flex-1">{t(option)}</span>
                {active && <Icon icon="lucide:check" className="size-4 shrink-0" aria-hidden />}
              </button>
            );
          })}
          <div className="border-editorial-line border-t" role="separator" />
          <button
            type="button"
            role="menuitem"
            onClick={() => choose(onRemove)}
            className={`${ITEM} text-red-400 hover:bg-red-500/10`}
          >
            <Icon icon="lucide:trash-2" className="size-4 shrink-0" aria-hidden />
            <span className="flex-1">{t("remove")}</span>
          </button>
        </div>
      )}
    </div>
  );
}
