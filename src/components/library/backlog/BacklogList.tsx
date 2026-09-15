"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { BacklogItem } from "./BacklogItem";
import type { BacklogGame } from "@/types/backlog";

interface BacklogListProps {
  games: BacklogGame[];
  locale: string;
  onReorder: (orderedGameIds: string[]) => void;
}

/**
 * Drag-and-drop backlog list using the native HTML5 DnD API (no external deps).
 * Reordering is committed on drop; the parent persists the new order.
 */
export function BacklogList({ games, locale, onReorder }: BacklogListProps) {
  const t = useTranslations("userLibrary.backlog");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDrop = () => {
    if (dragIndex === null || overIndex === null || dragIndex === overIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }

    const reordered = [...games];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(overIndex, 0, moved);

    setDragIndex(null);
    setOverIndex(null);
    onReorder(reordered.map((g) => g.id));
  };

  return (
    <ol className="flex flex-col gap-2" aria-label={t("listLabel")}>
      {games.map((game, index) => (
        <BacklogItem
          key={game.id}
          game={game}
          index={index}
          locale={locale}
          isDragging={dragIndex === index}
          isDragOver={overIndex === index && dragIndex !== index}
          onDragStart={setDragIndex}
          onDragOver={setOverIndex}
          onDrop={handleDrop}
          onDragEnd={() => {
            setDragIndex(null);
            setOverIndex(null);
          }}
        />
      ))}
    </ol>
  );
}
