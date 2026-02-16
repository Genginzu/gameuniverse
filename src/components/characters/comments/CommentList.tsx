"use client";

import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Comment } from "@/types/comment";
import { CommentCard } from "./CommentCard";

interface CommentListProps {
  comments: Comment[];
}

function CommentListEmpty() {
  const t = useTranslations("characters.comments");

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 py-12 text-center">
      <MessageCircle className="mb-3 h-10 w-10 text-slate-600" />
      <p className="text-lg font-medium text-slate-400">{t("emptyTitle")}</p>
      <p className="mt-1 text-sm text-slate-500">{t("emptyDescription")}</p>
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
