"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { GAME_LISTING_SORT_OPTIONS, GameListingSort } from "@/types/game";

const SORT_ICONS: Record<GameListingSort, string> = {
  recommended: "mdi:star-four-points",
  popularity: "mdi:fire",
  activity: "mdi:account-group",
  rating: "mdi:trophy",
  recent: "mdi:calendar-clock",
};

interface GameSortMenuProps {
  value: GameListingSort;
  onChange: (value: GameListingSort) => void;
}

export function GameSortMenu({ value, onChange }: GameSortMenuProps) {
  const t = useTranslations("games.sort");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="group bg-editorial-2 border-editorial-line hover:bg-editorial-3 hover:border-editorial-accent/45 aria-expanded:bg-editorial-3 aria-expanded:border-editorial-accent/45 inline-flex h-12 items-center gap-2 rounded-xl border px-4 text-sm font-semibold text-white transition sm:h-14 sm:px-5 sm:text-base"
      >
        <Icon icon={SORT_ICONS[value]} className="size-4 sm:size-5" />
        <span className="text-editorial-muted hidden font-medium sm:inline">{t("label")}</span>
        <span className="text-editorial-accent hidden sm:inline">{t(value)}</span>
        <Icon
          icon="mdi:chevron-down"
          className="size-4 transition-transform group-aria-expanded:rotate-180"
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="bg-editorial-2 border-editorial-line absolute top-[calc(100%+0.5rem)] right-0 z-20 w-56 overflow-hidden rounded-xl border shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
        >
          {GAME_LISTING_SORT_OPTIONS.map((option) => {
            const active = option === value;
            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                  active
                    ? "text-editorial-accent bg-editorial-accent/10"
                    : "text-editorial-muted hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon icon={SORT_ICONS[option]} className="size-4 shrink-0" />
                <span className="flex-1">{t(option)}</span>
                {active && <Icon icon="mdi:check" className="size-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
