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
          className="border-editorial-line bg-editorial-2 text-editorial-muted hover:bg-editorial-3 hover:border-editorial-accent/50 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border transition-all duration-300"
          aria-label={t("back")}
        >
          <Icon icon="lucide:arrow-left" className="size-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="font-display flex items-center gap-2 text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
            <Icon
              icon="lucide:hash"
              className="text-editorial-accent size-5 shrink-0 sm:size-6"
            />
            <span className="truncate">{tag}</span>
          </h1>
          {data && (
            <p className="text-editorial-muted text-sm">
              {t("count", { count: data.pagination.totalCount })}
            </p>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/[0.06]" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && data && data.posts.length === 0 && (
        <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center rounded-2xl border px-6 py-16 text-center">
          <Icon icon="lucide:hash" className="text-editorial-muted mb-4 size-12" />
          <p className="text-lg font-semibold text-white/85">{t("empty")}</p>
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
