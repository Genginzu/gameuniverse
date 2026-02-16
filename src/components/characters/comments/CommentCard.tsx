"use client";

import { User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDateFormatter } from "@/hooks/useTranslations";
import type { Comment } from "@/types/comment";

interface CommentCardProps {
  comment: Comment;
}

function CommentAvatar({ name, avatar }: { name: string | null; avatar: string | null }) {
  const t = useTranslations("characters.comments");

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name ?? t("anonymousPlayer")}
        className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-600"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 ring-2 ring-slate-600">
      <User className="h-5 w-5 text-slate-400" />
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

      <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
        {comment.content}
      </p>
    </article>
  );
}
