"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Icon } from "@iconify/react";
import { LoadingButton } from "@/components/ui/loading-button";
import type { GroupPost } from "@/types/group";
import { useAuthorDisplayName } from "@/hooks/useAuthorDisplayName";

interface GroupPostsFeedProps {
  posts: GroupPost[];
  canPost: boolean;
  isPosting: boolean;
  onCreatePost: (content: string) => Promise<void>;
}

export function GroupPostsFeed({ posts, canPost, isPosting, onCreatePost }: GroupPostsFeedProps) {
  const t = useTranslations("groups.posts");
  const displayAuthor = useAuthorDisplayName();
  const locale = useLocale();
  const [content, setContent] = useState("");

  const handleSubmit = async () => {
    if (!content.trim()) return;
    await onCreatePost(content.trim());
    setContent("");
  };

  return (
    <div className="flex flex-col gap-4">
      {canPost && (
        <div className="border-editorial-line bg-editorial-2 rounded-2xl border p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("composerPlaceholder")}
            maxLength={2000}
            rows={3}
            className="border-editorial-line bg-editorial-3 placeholder:text-editorial-muted w-full resize-none rounded-xl border p-3 text-base text-white outline-none focus-visible:border-[rgba(var(--accent-rgb,var(--neon-primary)),0.5)]"
          />
          <div className="mt-3 flex justify-end">
            <LoadingButton
              onClick={handleSubmit}
              loading={isPosting}
              loadingText={t("posting")}
              disabled={!content.trim()}
            >
              {t("post")}
            </LoadingButton>
          </div>
        </div>
      )}

      {posts.length === 0 ? (
        <p className="text-editorial-muted text-center text-sm">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((post) => (
            <li
              key={post.id}
              className="border-editorial-line bg-editorial-2 rounded-2xl border p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <Icon icon="lucide:user-circle" className="text-editorial-muted h-5 w-5" />
                <span className="text-sm font-medium text-white">
                  {displayAuthor(post.authorId, post.author.username, t("unknownAuthor"))}
                </span>
                <span className="text-editorial-muted text-xs">
                  {new Intl.DateTimeFormat(locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(post.createdAt))}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap text-white/90">{post.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
