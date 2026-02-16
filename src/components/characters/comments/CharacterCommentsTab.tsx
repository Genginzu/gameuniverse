"use client";

import { LogIn, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { useComments } from "@/hooks/useComments";
import { CommentForm } from "./CommentForm";
import { CommentList } from "./CommentList";
import type { CommentFormData } from "@/types/comment";

interface CharacterCommentsTabProps {
  characterId: string;
}

function CommentCount({ count }: { count: number }) {
  const t = useTranslations("characters.comments");

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-800/30 px-5 py-4">
      <MessageCircle className="h-6 w-6 text-indigo-400" />
      <span className="text-2xl font-bold text-slate-200">{count}</span>
      <span className="text-sm text-slate-400">{t("count", { count })}</span>
    </div>
  );
}

function LoginPrompt() {
  const t = useTranslations("characters.comments");

  return (
    <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
      <LogIn className="mx-auto mb-3 h-8 w-8 text-slate-500" />
      <p className="text-sm text-slate-400">{t("loginPrompt")}</p>
    </div>
  );
}

export function CharacterCommentsTab({ characterId }: CharacterCommentsTabProps) {
  const { user, loading: authLoading } = useAuth();
  const {
    comments,
    totalCount,
    userHasCommented,
    userComment,
    error,
    submitting,
    submitComment,
    updateComment,
  } = useComments(characterId);

  const handleSubmit = async (data: CommentFormData): Promise<boolean> => {
    return submitComment(data);
  };

  const handleUpdate = async (data: CommentFormData): Promise<boolean> => {
    return updateComment(data);
  };

  const isAuthenticated = !authLoading && user !== null;
  const showCreateForm = isAuthenticated && !userHasCommented;
  const showEditForm = isAuthenticated && userHasCommented && userComment !== null;

  return (
    <div className="space-y-6">
      <CommentCount count={totalCount} />

      {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}

      {!authLoading && (
        <>
          {!isAuthenticated && <LoginPrompt />}
          {showCreateForm && <CommentForm onSubmit={handleSubmit} submitting={submitting} />}
          {showEditForm && (
            <CommentForm
              initialContent={userComment.content}
              onSubmit={handleUpdate}
              submitting={submitting}
              isEditing
            />
          )}
        </>
      )}

      <CommentList comments={comments} />
    </div>
  );
}
