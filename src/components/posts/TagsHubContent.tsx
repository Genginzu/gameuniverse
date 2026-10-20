"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { EditorialPostCard } from "@/components/posts/EditorialPostCard";
import { Pagination } from "@/components/shared/Pagination";
import { TrendingTags } from "@/components/posts/TrendingTags";
import { useSearchPosts } from "@/hooks/useSearchPosts";

const DISALLOWED_TAG_CHARS = /[^a-z0-9_-]/g;
const SEARCH_MIN_CHARS = 3;
const SEARCH_DEBOUNCE_MS = 300;
const SHORT_HINT_DELAY_MS = 3000;

/** Landing page for the "Social" category: search posts by tag + recent feed. */
export function TagsHubContent() {
  const t = useTranslations("posts.tags");
  const locale = useLocale();
  const { user, loading } = useAuth();

  const [rawSearch, setRawSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // Normalize the raw input into a valid tag token (drop leading #, lowercase).
  const normalized = useMemo(
    () => rawSearch.trim().replace(/^#/, "").toLowerCase().replace(DISALLOWED_TAG_CHARS, ""),
    [rawSearch]
  );

  // Only search from SEARCH_MIN_CHARS; shorter input falls back to the recent feed.
  const isSearchTooShort = normalized.length > 0 && normalized.length < SEARCH_MIN_CHARS;

  // Delay the hint so it only appears after the user pauses typing (avoids flashing).
  const [showShortHint, setShowShortHint] = useState(false);
  useEffect(() => {
    if (!isSearchTooShort) {
      setShowShortHint(false);
      return;
    }
    const timer = setTimeout(() => setShowShortHint(true), SHORT_HINT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isSearchTooShort, normalized]);

  // Debounce the query sent to the API.
  useEffect(() => {
    const effective = normalized.length >= SEARCH_MIN_CHARS ? normalized : "";
    const timer = setTimeout(() => {
      setDebouncedSearch(effective);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [normalized]);

  const { data, isLoading } = useSearchPosts(debouncedSearch, page);

  const handleSelectTag = (selected: string) => {
    setRawSearch(selected);
  };

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const posts = data?.posts ?? [];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display flex items-center gap-2 text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
          <Icon icon="lucide:hash" className="text-editorial-accent size-5 shrink-0 sm:size-6" />
          {t("hubTitle")}
        </h1>
        <p className="text-editorial-muted text-sm">{t("hubSubtitle")}</p>
      </div>

      {/* Login CTA for anonymous visitors */}
      {!loading && !user && (
        <div className="border-editorial-line bg-editorial-2 mb-6 flex flex-col items-start gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-editorial-muted text-sm">{t("loginPrompt")}</p>
          <Link
            href="/auth"
            className="btn-filled inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-medium"
          >
            <Icon icon="lucide:log-in" className="size-4" aria-hidden />
            {t("loginCta")}
          </Link>
        </div>
      )}

      {/* Search bar */}
      <div className="editorial-activity-search mb-6">
        <Icon icon="lucide:search" className="editorial-activity-search-icon" />
        <input
          type="text"
          value={rawSearch}
          onChange={(e) => setRawSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchAriaLabel")}
          className="editorial-activity-search-input"
        />
      </div>

      {/* Min-characters hint */}
      {showShortHint && (
        <p className="text-editorial-muted -mt-4 mb-6 text-xs">
          {t("searchMinHint", { min: SEARCH_MIN_CHARS })}
        </p>
      )}

      {/* Trending tags — clicking a chip fills the search */}
      <TrendingTags limit={20} onTagSelect={handleSelectTag} className="mb-6" />

      {/* Results heading */}
      <h2 className="mb-4 text-sm font-semibold tracking-tight text-white/90">
        {debouncedSearch ? t("resultsFor", { tag: debouncedSearch }) : t("recentTitle")}
      </h2>


      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/[0.06]" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && posts.length === 0 && (
        <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center rounded-2xl border px-6 py-16 text-center">
          <Icon icon="lucide:message-square-off" className="text-editorial-muted mb-4 size-12" />
          <p className="text-lg font-semibold text-white/85">{t("empty")}</p>
        </div>
      )}

      {/* Posts list */}
      {!isLoading && posts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <EditorialPostCard key={post.id} post={post} locale={locale} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={data.pagination.currentPage}
            totalPages={data.pagination.totalPages}
            totalCount={data.pagination.totalCount}
            onPageChange={handlePageChange}
            loading={isLoading}
          />
        </div>
      )}
    </div>
  );
}
