"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import type { Comment } from "@/types/comment";
import { CommentCard } from "./CommentCard";

interface CommentListProps {
  comments: Comment[];
}

function CommentListEmpty() {
  const t = useTranslations("characters.comments");

  return (
    <div className="border-editorial-line flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
      <Icon icon="lucide:message-circle" className="text-editorial-muted mb-3 h-10 w-10" />
      <p className="text-lg font-medium text-white">{t("emptyTitle")}</p>
      <p className="text-editorial-muted mt-1 text-sm">{t("emptyDescription")}</p>
    </div>
  );
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) return <CommentListEmpty />;

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentCard key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
