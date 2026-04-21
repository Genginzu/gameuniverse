"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useGlobalSync } from "@/hooks/useGlobalSync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@iconify/react";
import { Pagination } from "@/components/shared/Pagination";
import { GlobalSyncEntryRow } from "./GlobalSyncEntryRow";

export function GlobalSyncTab() {
  const t = useTranslations("admin.globalSync");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filter, setFilter] = useState<"all" | "matched" | "unmatched">("all");

  const { entries, total, totalPages, isLoading, downloadState, startDownload, stopDownload } = useGlobalSync(page, search, filter);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleSearch(); };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="glass-card rounded-xl p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg dark:text-white">{t("downloadTitle")}</h3>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm dark:text-gray-400">{t("downloadDescription")}</p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button onClick={startDownload} disabled={downloadState.isDownloading} className="flex-1 sm:flex-initial">
              <Icon icon={downloadState.isDownloading ? "svg-spinners:ring-resize" : "lucide:download"} className="mr-2 size-4" />
              {downloadState.isDownloading ? t("downloading") : t("startDownload")}
            </Button>
            {downloadState.isDownloading && (
              <Button variant="outline" onClick={stopDownload} className="shrink-0">
                <Icon icon="lucide:square" className="mr-2 size-4" />
                {t("stop")}
              </Button>
            )}
          </div>
        </div>
        {downloadState.isDownloading && (
          <div className="mt-4 space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"><div className="h-full animate-pulse rounded-full bg-linear-to-r from-cyan-500 to-violet-500" /></div>
            <p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">{t("progress", { inserted: downloadState.totalInserted, lastId: downloadState.lastId })}</p>
          </div>
        )}
        {downloadState.error && <p className="mt-3 text-sm text-red-500">{downloadState.error}</p>}
        {!downloadState.isDownloading && downloadState.totalInserted > 0 && <p className="mt-3 text-sm text-green-600 dark:text-green-400">{t("downloadComplete", { count: downloadState.totalInserted })}</p>}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 gap-2">
          <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={t("searchPlaceholder")} className="text-base sm:text-sm" />
          <Button variant="outline" onClick={handleSearch} className="shrink-0"><Icon icon="fa:search" className="size-4" /></Button>
        </div>
        <div className="flex gap-2">
          {(["all", "matched", "unmatched"] as const).map((f) => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }} className={`rounded-lg px-3 py-2 text-xs font-medium transition-all sm:text-sm ${filter === f ? "bg-linear-to-r from-cyan-500 to-violet-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"}`}>
              {t(`filter.${f}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"><span>{t("totalEntries", { count: total })}</span></div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : entries.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-xl p-8 text-center"><Icon icon="lucide:database" className="mb-3 size-10 text-gray-400" /><p className="text-sm text-gray-500 dark:text-gray-400">{t("noEntries")}</p></div>
      ) : (
        <div className="space-y-2">{entries.map((entry) => <GlobalSyncEntryRow key={entry.id} entry={entry} t={t} />)}</div>
      )}

      {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} totalCount={total} onPageChange={setPage} />}
    </div>
  );
}
