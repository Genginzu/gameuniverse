"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useGlobalSync } from "@/hooks/useGlobalSync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@iconify/react";
import { Pagination } from "@/components/shared/Pagination";

const IGDB_IMAGE_BASE = "https://images.igdb.com/igdb/image/upload";

export function GlobalSyncTab() {
  const t = useTranslations("admin.globalSync");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filter, setFilter] = useState<"all" | "matched" | "unmatched">("all");

  const { entries, total, totalPages, isLoading, downloadState, startDownload } = useGlobalSync(
    page,
    search,
    filter
  );

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const coverUrl = (imageId: string | null) =>
    imageId ? `${IGDB_IMAGE_BASE}/t_cover_small/${imageId}.jpg` : null;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Download section */}
      <div className="glass-card rounded-xl p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg dark:text-white">
              {t("downloadTitle")}
            </h3>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm dark:text-gray-400">
              {t("downloadDescription")}
            </p>
          </div>
          <Button
            onClick={startDownload}
            disabled={downloadState.isDownloading}
            className="w-full sm:w-auto"
          >
            <Icon
              icon={downloadState.isDownloading ? "svg-spinners:ring-resize" : "lucide:download"}
              className="mr-2 size-4"
            />
            {downloadState.isDownloading ? t("downloading") : t("startDownload")}
          </Button>
        </div>

        {/* Progress */}
        {downloadState.isDownloading && (
          <div className="mt-4 space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div className="h-full animate-pulse rounded-full bg-linear-to-r from-cyan-500 to-violet-500" />
            </div>
            <p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
              {t("progress", {
                inserted: downloadState.totalInserted,
                offset: downloadState.currentOffset,
              })}
            </p>
          </div>
        )}

        {downloadState.error && <p className="mt-3 text-sm text-red-500">{downloadState.error}</p>}

        {!downloadState.isDownloading && downloadState.totalInserted > 0 && (
          <p className="mt-3 text-sm text-green-600 dark:text-green-400">
            {t("downloadComplete", { count: downloadState.totalInserted })}
          </p>
        )}
      </div>

      {/* Filters & search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 gap-2">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("searchPlaceholder")}
            className="text-base sm:text-sm"
          />
          <Button variant="outline" onClick={handleSearch} className="shrink-0">
            <Icon icon="fa:search" className="size-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          {(["all", "matched", "unmatched"] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-all sm:text-sm ${
                filter === f
                  ? "bg-linear-to-r from-cyan-500 to-violet-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {t(`filter.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span>{t("totalEntries", { count: total })}</span>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-xl p-8 text-center">
          <Icon icon="lucide:database" className="mb-3 size-10 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("noEntries")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="glass-card flex items-center gap-3 rounded-xl p-3 md:gap-4 md:p-4"
            >
              {/* Cover */}
              <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-gray-200 md:size-12 dark:bg-gray-700">
                {coverUrl(entry.cover_image_id) ? (
                  <img
                    src={coverUrl(entry.cover_image_id)!}
                    alt={entry.name}
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <Icon icon="fa:gamepad" className="size-4 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {entry.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">IGDB #{entry.igdb_id}</p>
              </div>

              {/* Match status */}
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
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
