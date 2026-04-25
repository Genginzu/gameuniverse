"use client";

import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";

const IGDB_IMAGE_BASE = "https://images.igdb.com/igdb/image/upload";

interface GlobalSyncEntry {
  id: number;
  igdb_id: number;
  name: string;
  cover_image_id: string | null;
  matched_game_id: string | null;
  created_at: string;
}

export function GlobalSyncEntryRow({
  entry,
  t,
}: {
  entry: GlobalSyncEntry;
  t: (key: string) => string;
}) {
  const coverUrl = entry.cover_image_id
    ? `${IGDB_IMAGE_BASE}/t_cover_small/${entry.cover_image_id}.jpg`
    : null;

  return (
    <div className="glass-card flex items-center gap-3 rounded-xl p-3 md:gap-4 md:p-4">
      <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-gray-200 md:size-12 dark:bg-gray-700">
        {coverUrl ? (
          <img src={coverUrl} alt={entry.name} className="size-full object-cover" loading="lazy" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Icon icon="fa:gamepad" className="size-4 text-gray-400" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{entry.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">IGDB #{entry.igdb_id}</p>
      </div>
      <Badge
        variant={entry.matched_game_id ? "default" : "secondary"}
        className={
          entry.matched_game_id
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : ""
        }
      >
        {entry.matched_game_id ? t("matched") : t("unmatched")}
      </Badge>
    </div>
  );
}
