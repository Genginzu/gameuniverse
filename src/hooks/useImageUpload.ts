"use client";

import { useState, useCallback, useRef } from "react";

import { isAllowedMimeType, isValidFileSize } from "@/lib/validations/uploadValidation";
import {
  CROP_OUTPUT_FORMAT,
  MAX_FILE_SIZE_BYTES,
  type UploadContext,
  type UploadResponse,
} from "@/types/upload";

function getContentType(data: File | Blob): string {
  return data instanceof File ? data.type : CROP_OUTPUT_FORMAT;
}

interface UseImageUploadParams {
  context: UploadContext;
  maxSizeMB?: number;
  onUploadSuccess: (url: string) => void;
  onDelete?: () => void;
}

interface UseImageUploadReturn {
  previewUrl: string | null;
  uploading: boolean;
  progress: number;
  error: string | null;
  handleFileSelect: (file: File) => void;
  handleUpload: () => Promise<void>;
  handleCroppedUpload: (blob: Blob) => Promise<void>;
  handleDelete: () => Promise<void>;
  clearPreview: () => void;
}

export function useImageUpload({
  context,
  maxSizeMB = 5,
  onUploadSuccess,
  onDelete,
}: UseImageUploadParams): UseImageUploadReturn {
  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<XMLHttpRequest | null>(null);

  const maxBytes = maxSizeMB * 1024 * 1024;
  const effectiveMaxBytes = Math.min(maxBytes, MAX_FILE_SIZE_BYTES);

  const handleFileSelect = useCallback(
    (file: File) => {
      setError(null);

      if (!isAllowedMimeType(file.type)) {
        setError("invalidFormat");
        return;
      }

      if (!isValidFileSize(file.size) || file.size > effectiveMaxBytes) {
        setError("fileTooLarge");
        return;
      }

      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    },
    [effectiveMaxBytes]
  );

  const clearPreview = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setProgress(0);
  }, [previewUrl]);

  const uploadToStorage = useCallback(
    (signedUrl: string, data: File | Blob, contentType: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        abortRef.current = xhr;

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error("storageUploadFailed"));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("storageUploadFailed")));
        xhr.open("PUT", signedUrl);
        xhr.setRequestHeader("Content-Type", contentType);
        xhr.send(data);
      });
    },
    []
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    const contentType = getContentType(selectedFile);

    try {
      // Step 1: Request signed upload URL
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          contentType,
          fileSize: selectedFile.size,
        }),
      });

      if (!response.ok) {
        throw new Error("presignedFailed");
      }

      const { signedUrl, publicUrl }: UploadResponse = await response.json();

      // Step 2: Upload directly to Supabase Storage
      await uploadToStorage(signedUrl, selectedFile, contentType);

      // Step 3: Confirm upload
      const confirmResponse = await fetch("/api/upload/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, publicUrl }),
      });

      if (!confirmResponse.ok) {
        throw new Error("confirmFailed");
      }

      onUploadSuccess(publicUrl);
      clearPreview();
    } catch (err) {
      const message = err instanceof Error ? err.message : "uploadError";
      setError(message);
    } finally {
      setUploading(false);
      abortRef.current = null;
    }
  }, [selectedFile, context, uploadToStorage, onUploadSuccess, clearPreview]);

  const handleDelete = useCallback(async () => {
    onDelete?.();
    clearPreview();
  }, [onDelete, clearPreview]);

  const handleCroppedUpload = useCallback(
    async (blob: Blob) => {
      setSelectedFile(blob);
      setUploading(true);
      setProgress(0);
      setError(null);

      const contentType = CROP_OUTPUT_FORMAT;

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            context,
            contentType,
            fileSize: blob.size,
          }),
        });

        if (!response.ok) {
          throw new Error("presignedFailed");
        }

        const { signedUrl, publicUrl }: UploadResponse = await response.json();

        await uploadToStorage(signedUrl, blob, contentType);

        const confirmResponse = await fetch("/api/upload/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context, publicUrl }),
        });

        if (!confirmResponse.ok) {
          throw new Error("confirmFailed");
        }

        onUploadSuccess(publicUrl);
        clearPreview();
      } catch (err) {
        const message = err instanceof Error ? err.message : "uploadError";
        setError(message);
      } finally {
        setUploading(false);
        abortRef.current = null;
      }
    },
    [context, uploadToStorage, onUploadSuccess, clearPreview]
  );

  return {
    previewUrl,
    uploading,
    progress,
    error,
    handleFileSelect,
    handleUpload,
    handleCroppedUpload,
    handleDelete,
    clearPreview,
  };
}
