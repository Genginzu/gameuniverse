"use client";

import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import type { BulkGame, GameSyncStatus } from "@/hooks/useBulkImport";

const STATUS_CONFIG: Record<GameSyncStatus, { icon: string; className: string }> = {
  pending: { icon: "lucide:circle-dashed", className: "text-gray-400" },
  syncing: { icon: "lucide:loader-2", className: "text-cyan-500 animate-spin" },
  success: { icon: "lucide:check-circle", className: "text-green-500" },
  error: { icon: "lucide:x-circle", className: "text-red-500" },
};

export function BulkImportGameRow({
  game, status, errorMsg,
}: {
  game: BulkGame;
  status?: GameSyncStatus;
  errorMsg?: string;
}) {
  const config = status ? STATUS_CONFIG[status] : null;

  return (
    <div className={`glass-card flex items-center gap-3 rounded-xl p-3 transition-all ${
      status === "success" ? "border border-green-500/30 bg-green-50/30 dark:bg-green-900/10"
        : status === "error" ? "border border-red-500/30 bg-red-50/30 dark:bg-red-900/10"
        : status === "syncing" ? "border border-cyan-500/30 bg-cyan-50/30 dark:bg-cyan-900/10" : ""
    }`}>
      {config ? (
        <div className="flex size-10 shrink-0 items-center justify-center"><Icon icon={config.icon} className={`size-6 ${config.className}`} /></div>
      ) : (
        <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
          <img src={game.coverImage || "/assets/no-cover.png"} alt={game.title} className="size-full object-cover" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{game.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          IGDB #{game.igdbId}
          {game.viewCount > 0 && ` · 👁 ${game.viewCount}`}
          {game.metascore !== null && ` · ★ ${game.metascore}`}
        </p>
        {status === "error" && errorMsg && <p className="mt-0.5 truncate text-xs text-red-600 dark:text-red-400">{errorMsg}</p>}
      </div>
      <Link href={`/games/${game.slug}`} className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200">
        <Icon icon="lucide:external-link" className="size-4" />
      </Link>
    </div>
  );
}
