"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useTranslations, useLocale } from "next-intl";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { PostCard } from "@/components/players/posts/PostCard";
import { Pagination } from "@/components/shared/Pagination";
import type { TagPostsResponse } from "@/types/post";

interface TagPostsContentProps {
  tag: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TagPostsContent({ tag }: TagPostsContentProps) {
  const t = useTranslations("posts.tags");
  const locale = useLocale();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useSWR<TagPostsResponse>(
    `/api/posts/tags/${encodeURIComponent(tag)}?page=${page}`,
    fetcher
  );

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/players"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-white/40 text-gray-600 transition-all duration-300 hover:bg-white/60 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-700/60"
          aria-label={t("back")}
        >
          <Icon icon="lucide:arrow-left" className="size-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl dark:text-white">
            <Icon
              icon="lucide:hash"
              className="text-palette-primary-500 size-5 shrink-0 sm:size-6"
            />
            <span className="truncate">{tag}</span>
          </h1>
          {data && (
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {t("count", { count: data.pagination.totalCount })}
            </p>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl bg-white/40 dark:bg-slate-800/40"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && data && data.posts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white/40 px-6 py-16 text-center backdrop-blur-xl dark:bg-slate-800/50">
          <Icon icon="lucide:hash" className="mb-4 size-12 text-gray-300 dark:text-slate-600" />
          <p className="text-lg font-semibold text-gray-700 dark:text-slate-300">{t("empty")}</p>
        </div>
      )}

      {/* Posts list */}
      {!isLoading && data && data.posts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {data.posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              playerName={post.authorName}
              playerAvatar={post.authorAvatar}
              locale={locale}
              isOwner={false}
              onDelete={() => {}}
            />
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
