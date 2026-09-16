"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminLibrarySync, type MatchStatus, type PlatformMatch } from "@/hooks/useAdminLibrarySync";
import { GameLinkPicker } from "./GameLinkPicker";

const PLATFORMS = ["", "steam", "xbox", "playstation"] as const;
const STATUSES: MatchStatus[] = ["unmatched", "matched", "all"];

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
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          {t("filters.platform")}
          <select
            value={platform}
            onChange={(e) => {
              setPlatform(e.target.value);
              setPage(1);
            }}
            className="border-editorial-line bg-editorial-2 h-9 rounded-lg border px-2 text-sm text-white"
          >
            {PLATFORMS.map((p) => (
              <option key={p || "all"} value={p}>
                {p ? t(`platforms.${p}`) : t("filters.allPlatforms")}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          {t("filters.status")}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as MatchStatus);
              setPage(1);
            }}
            className="border-editorial-line bg-editorial-2 h-9 rounded-lg border px-2 text-sm text-white"
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
          <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
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
      <div className="border-editorial-line divide-editorial-line divide-y overflow-hidden rounded-xl border">
        {isLoading ? (
          <div className="text-editorial-muted p-6 text-center text-sm">{t("loading")}</div>
        ) : matches.length === 0 ? (
          <div className="text-editorial-muted p-6 text-center text-sm">{t("empty")}</div>
        ) : (
          matches.map((m) => (
            <div
              key={`${m.platform}:${m.sourceId}`}
              className="bg-editorial-3 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="bg-editorial-2 text-editorial-muted rounded px-1.5 py-0.5 text-[0.7rem] uppercase">
                    {t(`platforms.${m.platform}` as "platforms.steam")}
                  </span>
                  <span className="truncate text-sm font-medium text-white/90">
                    {m.name ?? m.sourceId}
                  </span>
                </div>
                <span className="text-editorial-muted text-xs">{m.sourceId}</span>
              </div>

              <div className="flex w-full items-center gap-2 sm:w-auto">
                {m.gameId ? (
                  <>
                    <span className="flex items-center gap-1.5 text-sm text-green-500">
                      <Icon icon="lucide:check-circle" className="h-4 w-4 shrink-0" />
                      <span className="truncate">{m.gameTitle ?? m.gameSlug}</span>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleLink(m, null)}
                      className="text-red-500 hover:text-red-600"
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
          ))
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
