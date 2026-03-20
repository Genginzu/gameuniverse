"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, Trash2, ImageIcon, Camera } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { CropEditor } from "@/components/shared/CropEditor";
import { useImageUpload } from "@/hooks/useImageUpload";
import { OUTPUT_DIMENSIONS, type UploadContext } from "@/types/upload";

interface ImageUploaderProps {
  context: UploadContext;
  currentImageUrl: string | null;
  aspectRatio: "1:1" | "16:5";
  maxSizeMB?: number;
  onUploadSuccess: (url: string) => void;
  onDelete?: () => void;
  /** Extra classes for the drop zone (e.g. to override height) */
  dropZoneClassName?: string;
}

export function ImageUploader({
  context,
  currentImageUrl,
  aspectRatio,
  maxSizeMB = 5,
  onUploadSuccess,
  onDelete,
  dropZoneClassName,
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
    handleCroppedUpload,
    handleDelete,
    clearPreview,
  } = useImageUpload({ context, maxSizeMB, onUploadSuccess, onDelete });

  const isAvatar = aspectRatio === "1:1";
  const showCropEditor = previewUrl !== null;

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
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

  const handleCropConfirm = useCallback(
    (blob: Blob) => {
      handleCroppedUpload(blob);
    },
    [handleCroppedUpload]
  );

  const handleCropCancel = useCallback(() => {
    clearPreview();
  }, [clearPreview]);

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
      {showCropEditor ? (
        <>
          <CropEditor
            imageSrc={previewUrl}
            aspectRatio={aspectRatio}
            outputSize={OUTPUT_DIMENSIONS[context]}
            onConfirm={handleCropConfirm}
            onCancel={handleCropCancel}
            disabled={uploading}
          />
          {/* Progress bar during upload */}
          {uploading && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-linear-to-r from-violet-500 to-cyan-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </>
      ) : (
        <>
          {/* Drop Zone / Current Image */}
          <div
            role="button"
            tabIndex={0}
            className={`group relative flex cursor-pointer items-center justify-center overflow-hidden transition-all duration-300 ${
              isAvatar
                ? "glass-card mx-auto h-32 w-32 rounded-xl"
                : `glass-card w-full rounded-xl ${dropZoneClassName ?? "h-28"}`
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
            {currentImageUrl ? (
              <>
                <Image
                  src={currentImageUrl}
                  alt={t("preview")}
                  fill
                  className="rounded-xl object-cover"
                />
                {/* Hover overlay — camera icon to signal clickability */}
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 transition-all duration-300 group-hover:bg-black/30">
                  <Camera className="h-6 w-6 text-white opacity-0 drop-shadow-lg transition-all duration-300 group-hover:opacity-100" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500">
                <ImageIcon className="h-8 w-8" />
                <span className="text-xs">{t("dragOrClick")}</span>
              </div>
            )}

            {/* Drag overlay */}
            {isDragging && !uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-violet-500/20 backdrop-blur-xs">
                <Upload className="h-8 w-8 text-violet-600 dark:text-violet-400" />
              </div>
            )}
          </div>

          {/* Delete badge — small corner button, stops propagation to avoid opening file picker */}
          {currentImageUrl && onDelete && !uploading && (
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/40 px-3 py-1.5 text-xs font-medium text-red-600 transition-all duration-300 hover:bg-red-50/60 dark:bg-slate-800/50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t("delete")}
              </button>
            </div>
          )}
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Error message */}
      {errorMessage && (
        <p className="text-center text-xs text-red-500 dark:text-red-400">{errorMessage}</p>
      )}
    </div>
  );
}
