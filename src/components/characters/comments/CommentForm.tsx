"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { commentSchema, type CommentInput } from "@/lib/validations/comment";
import { LoadingButton } from "@/components/ui/loading-button";
import type { CommentFormData } from "@/types/comment";

const MAX_CHARS = 1000;

interface CommentFormProps {
  initialContent?: string;
  onSubmit: (data: CommentFormData) => Promise<boolean>;
  submitting: boolean;
  isEditing?: boolean;
}

export function CommentForm({
  initialContent,
  onSubmit,
  submitting,
  isEditing = false,
}: CommentFormProps) {
  const t = useTranslations("characters.comments.form");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CommentInput>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: initialContent ?? "" },
  });

  const contentValue = watch("content");
  const trimmedLength = contentValue?.trim().length ?? 0;
  const isOverLimit = trimmedLength > MAX_CHARS;

  const handleFormSubmit = async (data: CommentInput) => {
    setSubmitError(null);
    try {
      const success = await onSubmit({ content: data.content.trim() });
      if (success && !isEditing) {
        reset({ content: "" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("error");
      setSubmitError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor="comment-content" className="text-foreground text-sm font-medium">
          {isEditing ? t("labelEdit") : t("labelCreate")}{" "}
          <span className="text-destructive">*</span>
        </label>

        <textarea
          id="comment-content"
          {...register("content")}
          rows={4}
          placeholder={t("placeholder")}
          className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
        />

        <div className="flex items-center justify-between">
          <div className="min-h-5">
            {errors.content && <p className="text-destructive text-sm">{errors.content.message}</p>}
          </div>
          <span className={`text-xs ${isOverLimit ? "text-destructive" : "text-slate-500"}`}>
            {trimmedLength}/{MAX_CHARS}
          </span>
        </div>
      </div>

      {submitError && (
        <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{submitError}</p>
      )}

      <LoadingButton
        type="submit"
        loading={submitting}
        loadingText={isEditing ? t("submittingEdit") : t("submitting")}
      >
        {isEditing ? (
          <Icon icon="lucide:pencil" className="mr-2 h-4 w-4" />
        ) : (
          <Icon icon="lucide:send" className="mr-2 h-4 w-4" />
        )}
        {isEditing ? t("submitEdit") : t("submit")}
      </LoadingButton>
    </form>
  );
}
