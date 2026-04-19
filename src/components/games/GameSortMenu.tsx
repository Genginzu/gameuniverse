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
        className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-xl border border-white/20 bg-white/60 px-4 text-sm font-semibold text-gray-700 shadow-sm backdrop-blur-md transition-all hover:bg-white/80 sm:h-14 sm:px-5 sm:text-base dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800/70"
      >
        <Icon icon={SORT_ICONS[value]} className="size-4 sm:size-5" />
        <span className="hidden sm:inline">{t("label")}</span>
        <span className="hidden text-cyan-600 sm:inline dark:text-cyan-400">{t(value)}</span>
        <Icon
          icon="mdi:chevron-down"
          className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute top-full right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-white/20 bg-white/90 shadow-xl backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/90"
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
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                  active
                    ? "bg-linear-to-r from-cyan-500/10 to-violet-500/10 text-cyan-600 dark:text-cyan-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800"
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
