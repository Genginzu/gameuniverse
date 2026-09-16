"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAdminLibrarySync,
  type MatchStatus,
  type PlatformMatch,
} from "@/hooks/useAdminLibrarySync";
import { GameLinkPicker } from "./GameLinkPicker";

const PLATFORMS = ["", "steam", "xbox", "playstation"] as const;
const STATUSES: MatchStatus[] = ["unmatched", "matched", "all"];

const selectClasses =
  "h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white";
const labelClasses = "flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400";

export function AdminLibrarySyncContent() {
  const t = useTranslations("admin.librarySync");
  const locale = useLocale();

  const [platform, setPlatform] = useState("");
  const [status, setStatus] = useState<MatchStatus>("unmatched");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { matches, total, pageSize, isLoading, linkMatch } = useAdminLibrarySync({
    platform,
    status,
    search,
    page,
    locale,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleLink = async (m: PlatformMatch, gameId: string | null) => {
    try {
      await linkMatch(m.platform, m.sourceId, gameId);
      toast({ title: gameId ? t("linkedToast") : t("unlinkedToast"), variant: "success" });
    } catch {
      toast({ title: t("errorToast"), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <header>
        <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("description")}</p>
      </header>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className={labelClasses}>
          {t("filters.platform")}
          <select
            value={platform}
            onChange={(e) => {
              setPlatform(e.target.value);
              setPage(1);
            }}
            className={selectClasses}
          >
            {PLATFORMS.map((p) => (
              <option key={p || "all"} value={p}>
                {p ? t(`platforms.${p}`) : t("filters.allPlatforms")}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClasses}>
          {t("filters.status")}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as MatchStatus);
              setPage(1);
            }}
            className={selectClasses}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`filters.${s}`)}
              </option>
            ))}
          </select>
        </label>

        <form
          className="flex flex-1 items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput);
            setPage(1);
          }}
        >
          <label className={`${labelClasses} flex-1`}>
            {t("filters.search")}
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-9 text-base"
            />
          </label>
          <Button type="submit" variant="secondary">
            <Icon icon="lucide:search" className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">{t("count", { total })}</p>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {t("loading")}
          </div>
        ) : matches.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {t("empty")}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {matches.map((m) => (
              <div
                key={`${m.platform}:${m.sourceId}`}
                className="flex flex-col gap-3 bg-white p-3 sm:flex-row sm:items-center sm:justify-between dark:bg-gray-800"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[0.7rem] text-gray-600 uppercase dark:bg-gray-700 dark:text-gray-300">
                      {t(`platforms.${m.platform}` as "platforms.steam")}
                    </span>
                    <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {m.name ?? m.sourceId}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{m.sourceId}</span>
                </div>

                <div className="flex w-full items-center gap-2 sm:w-auto">
                  {m.gameId ? (
                    <>
                      <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                        <Icon icon="lucide:check-circle" className="h-4 w-4 shrink-0" />
                        <span className="truncate">{m.gameTitle ?? m.gameSlug}</span>
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleLink(m, null)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                        title={t("unlink")}
                      >
                        <Icon icon="lucide:unlink" className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <GameLinkPicker onSelect={(gameId) => handleLink(m, gameId)} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <Icon icon="lucide:chevron-left" className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {t("pageOf", { page, total: totalPages })}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <Icon icon="lucide:chevron-right" className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
