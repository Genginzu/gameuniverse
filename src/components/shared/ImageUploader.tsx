"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, Trash2, Loader2, ImageIcon, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { useImageUpload } from "@/hooks/useImageUpload";
import type { UploadContext } from "@/types/upload";

interface ImageUploaderProps {
  context: UploadContext;
  currentImageUrl: string | null;
  aspectRatio: "1:1" | "16:5";
  maxSizeMB?: number;
  onUploadSuccess: (url: string) => void;
  onDelete?: () => void;
}

export function ImageUploader({
  context,
  currentImageUrl,
  aspectRatio,
  maxSizeMB = 5,
  onUploadSuccess,
  onDelete,
}: ImageUploaderProps) {
  const t = useTranslations("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
    previewUrl,
    uploading,
    progress,
    error,
    handleFileSelect,
    handleUpload,
    handleDelete,
    clearPreview,
  } = useImageUpload({ context, maxSizeMB, onUploadSuccess, onDelete });

  const isCircular = aspectRatio === "1:1";
  const displayUrl = previewUrl || currentImageUrl;

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [handleFileSelect]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const errorMessage = error
    ? t(
        error === "invalidFormat"
          ? "errorInvalidFormat"
          : error === "fileTooLarge"
            ? "errorFileTooLarge"
            : "errorUploadFailed"
      )
    : null;

  return (
    <div className="space-y-3">
      {/* Preview + Drop Zone */}
      <div
        role="button"
        tabIndex={0}
        className={`glass-card relative flex cursor-pointer items-center justify-center overflow-hidden transition-all duration-300 ${
          isCircular ? "mx-auto h-32 w-32 rounded-full" : "h-28 w-full rounded-xl"
        } ${isDragging ? "ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-slate-900" : ""} ${
          uploading ? "pointer-events-none opacity-70" : ""
        }`}
        onClick={() => !uploading && fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !uploading && fileInputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        aria-label={t("selectImage")}
      >
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt={t("preview")}
            fill
            className={`object-cover ${isCircular ? "rounded-full" : "rounded-xl"}`}
            unoptimized={previewUrl !== null}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500">
            <ImageIcon className="h-8 w-8" />
            <span className="text-xs">{t("dragOrClick")}</span>
          </div>
        )}

        {/* Upload progress overlay */}
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
            <span className="mt-1 text-xs font-medium text-white">{progress}%</span>
          </div>
        )}

        {/* Drag overlay */}
        {isDragging && !uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-violet-500/20 backdrop-blur-sm">
            <Upload className="h-8 w-8 text-violet-600 dark:text-violet-400" />
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Progress bar */}
      {uploading && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <p className="text-center text-xs text-red-500 dark:text-red-400">{errorMessage}</p>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-2">
        {previewUrl && !uploading && (
          <>
            <button
              type="button"
              onClick={handleUpload}
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-all duration-300 hover:bg-violet-700"
            >
              <Upload className="h-3.5 w-3.5" />
              {t("confirm")}
            </button>
            <button
              type="button"
              onClick={clearPreview}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/40 px-3 py-1.5 text-xs font-medium text-gray-700 transition-all duration-300 hover:bg-white/60 dark:bg-slate-800/50 dark:text-gray-300 dark:hover:bg-slate-700/60"
            >
              <X className="h-3.5 w-3.5" />
              {t("cancel")}
            </button>
          </>
        )}

        {!previewUrl && currentImageUrl && onDelete && !uploading && (
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/40 px-3 py-1.5 text-xs font-medium text-red-600 transition-all duration-300 hover:bg-red-50/60 dark:bg-slate-800/50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("delete")}
          </button>
        )}
      </div>
    </div>
  );
}
