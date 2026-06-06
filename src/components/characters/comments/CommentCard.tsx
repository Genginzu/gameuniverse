"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { useDateFormatter } from "@/hooks/useTranslations";
import { LazyImage } from "@/components/ui/lazy-image";
import type { Comment } from "@/types/comment";

interface CommentCardProps {
  comment: Comment;
}

function CommentAvatar({ name, avatar }: { name: string | null; avatar: string | null }) {
  const t = useTranslations("characters.comments");

  if (avatar) {
    return (
      <LazyImage
        src={avatar}
        alt={name ?? t("anonymousPlayer")}
        width={40}
        height={40}
        className="border-editorial-line h-10 w-10 rounded-full object-cover ring-2 ring-[var(--editorial-line)]"
        showSkeleton={true}
      />
    );
  }

  return (
    <div className="bg-editorial-3 flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-[var(--editorial-line)]">
      <Icon icon="lucide:user" className="text-editorial-muted h-5 w-5" />
    </div>
  );
}

export function CommentCard({ comment }: CommentCardProps) {
  const t = useTranslations("characters.comments");
  const { formatDate } = useDateFormatter();

  return (
    <article className="border-editorial-line bg-editorial-2 rounded-xl border p-5">
      <div className="mb-3 flex items-center gap-3">
        <CommentAvatar name={comment.playerName} avatar={comment.playerAvatar} />
        <div>
          <p className="font-medium text-white">{comment.playerName ?? t("anonymousPlayer")}</p>
          <p className="text-editorial-muted text-xs">{formatDate(comment.createdAt)}</p>
        </div>
      </div>

      <p className="text-editorial-muted text-sm leading-relaxed whitespace-pre-line">
        {comment.content}
      </p>
    </article>
  );
}
