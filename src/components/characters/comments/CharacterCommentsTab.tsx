"use client";

import { useEffect } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { useComments } from "@/hooks/useComments";
import { Skeleton } from "@/components/ui/skeleton";
import { CommentForm } from "./CommentForm";
import { CommentList } from "./CommentList";
import type { CommentFormData } from "@/types/comment";

interface CharacterCommentsTabProps {
  characterId: string;
  onCountLoaded?: (count: number) => void;
}

function CommentCount({ count }: { count: number }) {
  const t = useTranslations("characters.comments");

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-800/30 px-5 py-4">
      <Icon icon="lucide:message-circle" className="h-6 w-6 text-indigo-400" />
      <span className="text-2xl font-bold text-slate-200">{count}</span>
      <span className="text-sm text-slate-400">{t("count", { count })}</span>
    </div>
  );
}

function LoginPrompt() {
  const t = useTranslations("characters.comments");

  return (
    <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
      <Icon icon="lucide:log-in" className="mx-auto mb-3 h-8 w-8 text-slate-500" />
      <p className="text-sm text-slate-400">{t("loginPrompt")}</p>
    </div>
  );
}

/** Skeleton affiché pendant le chargement initial des commentaires */
function CommentsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Count skeleton */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-800/30 px-5 py-4">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-7 w-10" />
        <Skeleton className="h-4 w-24" />
      </div>
      {/* Comment cards skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
          <div className="mb-3 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CharacterCommentsTab({ characterId, onCountLoaded }: CharacterCommentsTabProps) {
  const { user, loading: authLoading } = useAuth();
  const {
    comments,
    totalCount,
    userHasCommented,
    userComment,
    loading,
    error,
    submitting,
    submitComment,
    updateComment,
  } = useComments(characterId);

  // Remonter le count au parent quand il est disponible
  useEffect(() => {
    if (onCountLoaded && !loading) {
      onCountLoaded(totalCount);
    }
  }, [onCountLoaded, loading, totalCount]);

  const handleSubmit = async (data: CommentFormData): Promise<boolean> => {
    return submitComment(data);
  };

  const handleUpdate = async (data: CommentFormData): Promise<boolean> => {
    return updateComment(data);
  };

  // Skeleton pendant le chargement initial
  if (loading) {
    return <CommentsSkeleton />;
  }

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
