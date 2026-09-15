"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { formatPlayTime } from "@/lib/utils/formatPlayTime";
import type { BacklogGame } from "@/types/backlog";

interface BacklogItemProps {
  game: BacklogGame;
  index: number;
  locale: string;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

/** A single, draggable backlog row. */
export function BacklogItem({
  game,
  index,
  locale,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: BacklogItemProps) {
  const t = useTranslations("userLibrary.backlog");

  return (
    <li
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      onDragEnd={onDragEnd}
      data-testid="backlog-item"
      className={`border-editorial-line bg-editorial-2 flex items-center gap-3 rounded-2xl border p-3 transition-all ${
        isDragging ? "opacity-40" : ""
      } ${isDragOver ? "ring-editorial-accent ring-2" : ""}`}
    >
      <button
        type="button"
        aria-label={t("dragHandle")}
        className="text-editorial-muted hover:text-white flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg active:cursor-grabbing"
      >
        <Icon icon="lucide:grip-vertical" className="h-5 w-5" />
      </button>

      <Link href={`/games/${game.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className="bg-editorial-3 relative h-16 w-12 shrink-0 overflow-hidden rounded-md"
          style={game.backgroundColor ? { backgroundColor: game.backgroundColor } : undefined}
        >
          {game.coverImage ? (
            <img
              src={game.coverImage}
              alt={game.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : null}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-white">{game.title}</span>
          <span className="text-editorial-muted mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
            {game.remainingHours !== null ? (
              <span className="inline-flex items-center gap-1">
                <Icon icon="lucide:clock" className="h-3.5 w-3.5" />
                {t("hoursRemaining", { hours: formatPlayTime(game.remainingHours, locale) })}
              </span>
            ) : (
              <span>{t("noEstimate")}</span>
            )}
            {game.genres[0]?.name ? <span>· {game.genres[0].name}</span> : null}
          </span>
        </span>
      </Link>
    </li>
  );
}
