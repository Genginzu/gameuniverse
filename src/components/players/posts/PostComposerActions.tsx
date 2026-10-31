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
        className="border-editorial-line bg-editorial-3 hover:border-editorial-accent/55 inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-2 text-xs text-white transition disabled:opacity-50"
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
        className="btn-filled inline-flex h-11 shrink-0 items-center gap-2 rounded-md px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
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
