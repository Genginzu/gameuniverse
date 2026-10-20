"use client";

import { useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { LazyImage } from "@/components/ui/lazy-image";
import { PostContentRenderer } from "@/components/players/posts/PostContentRenderer";
import type { PostWithAuthor } from "@/types/post";
import { useAuthorDisplayName } from "@/hooks/useAuthorDisplayName";

interface EditorialPostCardProps {
  post: PostWithAuthor;
  locale: string;
}

/** Read-only post card styled for the editorial (dark) theme. */
export function EditorialPostCard({ post, locale }: EditorialPostCardProps) {
  const t = useTranslations("players.posts");
  const displayAuthor = useAuthorDisplayName();
  const format = useFormatter();
  const [imageError, setImageError] = useState(false);

  const createdAt = new Date(post.createdAt);
  const now = new Date();
  const safeDate = createdAt > now ? now : createdAt;
  const relativeDate = format.relativeTime(safeDate, now);
  const displayName = displayAuthor(post.playerId, post.authorName, t("anonymousPlayer"));

  return (
    <article className="border-editorial-line bg-editorial-2 hover:border-editorial-accent/40 rounded-2xl border p-5 transition-all duration-300">
      <div className="mb-3 flex items-center gap-3">
        <div className="bg-editorial-3 relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
          {post.authorAvatar ? (
            <LazyImage
              src={post.authorAvatar}
              alt={displayName}
              fill
              className="object-cover"
              sizes="40px"
              showSkeleton
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Icon icon="lucide:user" className="text-editorial-muted h-5 w-5" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{displayName}</p>
          <time
            dateTime={post.createdAt}
            className="text-editorial-muted text-xs"
            suppressHydrationWarning
          >
            {relativeDate}
          </time>
        </div>
      </div>

      <div className="pl-[52px]">
        {post.imageUrl && !imageError && (
          <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-xl">
            <Image
              src={post.imageUrl}
              alt=""
              fill
              onError={() => setImageError(true)}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
            />
          </div>
        )}

        <PostContentRenderer
          content={post.content}
          tags={post.tags}
          mentions={post.mentions}
          locale={locale}
          className="text-sm leading-relaxed whitespace-pre-wrap text-white/80"
        />
      </div>
    </article>
  );
}
