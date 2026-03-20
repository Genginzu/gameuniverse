"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { commentSchema, type CommentInput } from "@/lib/validations/comment";
import { LoadingButton } from "@/components/ui/loading-button";
import type { AdminCommentDetail } from "@/types/admin-comments";

export interface AdminCommentFormProps {
  comment: AdminCommentDetail;
  onSubmit: (data: CommentInput) => Promise<void>;
  isSubmitting: boolean;
}

export function AdminCommentForm({ comment, onSubmit, isSubmitting }: AdminCommentFormProps) {
  const t = useTranslations("admin.comments.editPage");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CommentInput>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: comment.content,
    },
  });

  const contentValue = watch("content");
  const charCount = contentValue?.trim().length ?? 0;

  const handleFormSubmit = async (data: CommentInput) => {
    setSubmitError(null);
    try {
      await onSubmit(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("errorGeneric");
      setSubmitError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Read-only info */}
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t("playerLabel")}
          </span>
          <p className="text-gray-900 dark:text-white">{comment.playerName ?? "—"}</p>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t("characterLabel")}
          </span>
          <p className="text-gray-900 dark:text-white">{comment.characterName}</p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <label htmlFor="comment-content" className="text-sm font-medium text-foreground">
          {t("contentLabel")} <span className="text-destructive">*</span>
        </label>
        <textarea
          id="comment-content"
          {...register("content")}
          rows={6}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          placeholder={t("contentPlaceholder")}
        />
        <div className="flex items-center justify-between">
          {errors.content ? (
            <p className="text-sm text-destructive">{errors.content.message}</p>
          ) : (
            <span />
          )}
          <span
            className={`text-xs ${charCount > 1000 ? "text-destructive" : "text-muted-foreground"}`}
          >
            {charCount}/1000
          </span>
        </div>
      </div>

      {submitError && (
        <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{submitError}</p>
      )}

      {/* Submit */}
      <LoadingButton type="submit" loading={isSubmitting} loadingText={t("saving")}>
        {t("save")}
      </LoadingButton>
    </form>
  );
}
