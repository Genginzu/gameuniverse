"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

const MAX_CHARS = 500;

interface PostCommentFormProps {
  onSubmit: (content: string) => Promise<boolean>;
  isSubmitting: boolean;
}

export function PostCommentForm({ onSubmit, isSubmitting }: PostCommentFormProps) {
  const t = useTranslations("postComments");
  const [content, setContent] = useState("");

  const trimmed = content.trim();
  const remaining = MAX_CHARS - trimmed.length;
  const canSubmit = trimmed.length > 0 && trimmed.length <= MAX_CHARS && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const success = await onSubmit(trimmed);
    if (success) setContent("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t("placeholder")}
        aria-label={t("placeholder")}
        maxLength={MAX_CHARS}
        rows={2}
        disabled={isSubmitting}
        className="focus:border-palette-primary-400 focus:ring-palette-primary-400 dark:focus:border-palette-primary-500 dark:focus:ring-palette-primary-500 w-full resize-none rounded-xl border border-white/20 bg-white/50 p-3 text-base text-gray-900 placeholder-gray-400 backdrop-blur-sm transition-colors focus:ring-1 focus:outline-none disabled:opacity-50 dark:border-slate-600/50 dark:bg-slate-700/40 dark:text-white dark:placeholder-slate-500"
      />

      <div className="flex items-center justify-between">
        <span
          className={`text-xs ${remaining < 50 ? "text-amber-500 dark:text-amber-400" : "text-gray-400 dark:text-slate-500"}`}
        >
          {t("charCount", { remaining })}
        </span>

        <button
          type="submit"
          disabled={!canSubmit}
          className="bg-palette-primary-600 hover:bg-palette-primary-700 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting && <Icon icon="lucide:loader-2" className="h-3.5 w-3.5 animate-spin" />}
          {t("submit")}
        </button>
      </div>
    </form>
  );
}
