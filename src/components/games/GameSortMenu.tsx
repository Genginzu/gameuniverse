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
    <div ref={containerRef} className="editorial-sort-menu">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="editorial-sort-menu-trigger"
      >
        <Icon icon={SORT_ICONS[value]} className="size-4 sm:size-5" />
        <span className="editorial-sort-menu-trigger-label">{t("label")}</span>
        <span className="editorial-sort-menu-trigger-value">{t(value)}</span>
        <Icon
          icon="mdi:chevron-down"
          className="editorial-sort-menu-trigger-chevron size-4"
        />
      </button>

      {open && (
        <div role="listbox" className="editorial-sort-menu-list">
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
                className={`editorial-sort-menu-option ${active ? "is-active" : ""}`.trim()}
              >
                <Icon icon={SORT_ICONS[option]} className="size-4 shrink-0" />
                <span className="editorial-sort-menu-option-label">
                  {t(option)}
                </span>
                {active && <Icon icon="mdi:check" className="size-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
