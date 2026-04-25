"use client";

import { Icon } from "@iconify/react";

interface PostImagePreviewProps {
  previewUrl: string;
  uploading: boolean;
  progress: number;
  error: string | null;
  onClear: () => void;
  removeLabel: string;
  errorPrefix: string;
}

export function PostImagePreview({
  previewUrl,
  uploading,
  progress,
  error,
  onClear,
  removeLabel,
  errorPrefix,
}: PostImagePreviewProps) {
  return (
    <>
      {previewUrl && (
        <div className="relative mt-2 overflow-hidden rounded-xl">
          <img src={previewUrl} alt="" className="max-h-48 w-full rounded-xl object-cover" />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
              <div className="flex items-center gap-2 text-sm text-white">
                <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
                {progress}%
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-black/70"
            aria-label={removeLabel}
          >
            <Icon icon="lucide:x" className="h-4 w-4" />
          </button>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{`${errorPrefix}${error}`}</p>}
    </>
  );
}
