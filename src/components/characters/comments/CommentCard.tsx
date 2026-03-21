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
        className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-600"
        showSkeleton={true}
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 ring-2 ring-slate-600">
      <Icon icon="lucide:user" className="h-5 w-5 text-slate-400" />
    </div>
  );
}

export function CommentCard({ comment }: CommentCardProps) {
  const t = useTranslations("characters.comments");
  const { formatDate } = useDateFormatter();

  return (
    <article className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
      <div className="mb-3 flex items-center gap-3">
        <CommentAvatar name={comment.playerName} avatar={comment.playerAvatar} />
        <div>
          <p className="font-medium text-slate-200">{comment.playerName ?? t("anonymousPlayer")}</p>
          <p className="text-xs text-slate-500">{formatDate(comment.createdAt)}</p>
        </div>
      </div>

      <p className="text-sm leading-relaxed whitespace-pre-line text-slate-300">
        {comment.content}
      </p>
    </article>
  );
}
