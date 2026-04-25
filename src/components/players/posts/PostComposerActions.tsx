"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

interface PostComposerActionsProps {
  onImageClick: () => void;
  onSubmit: () => void;
  isDisabled: boolean;
  isCreating: boolean;
  isUploading: boolean;
}

export function PostComposerActions({
  onImageClick,
  onSubmit,
  isDisabled,
  isCreating,
  isUploading,
}: PostComposerActionsProps) {
  const t = useTranslations("players.posts");

  return (
    <div className="mt-3 flex items-center gap-2">
      <button
        type="button"
        onClick={onImageClick}
        disabled={isUploading}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-palette-primary-300 bg-white/60 px-3 py-2 text-xs text-palette-primary-500 transition-all duration-200 hover:bg-palette-primary-50 disabled:opacity-50 dark:border-palette-primary-500/50 dark:bg-slate-700/40 dark:text-palette-primary-300 dark:hover:bg-slate-700/60"
        aria-label={t("imageUploadLabel")}
      >
        <Icon icon="lucide:image" className="h-4 w-4" />
        {t("imageUploadButton")}
      </button>

      <div className="flex-1" />

      <button
        type="button"
        onClick={onSubmit}
        disabled={isDisabled}
        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-linear-to-br from-palette-primary-500 to-blue-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-palette-primary-500/20 transition-all duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isCreating ? (
          <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
        ) : (
          <Icon icon="lucide:send" className="h-4 w-4" />
        )}
        {t("publish")}
      </button>
    </div>
  );
}
