"use client";

import { useState, useCallback, useRef } from "react";

import { isAllowedMimeType, isValidFileSize } from "@/lib/validations/uploadValidation";
import { MAX_FILE_SIZE_BYTES, type UploadResponse } from "@/types/upload";

export interface UsePostImageUploadReturn {
  previewUrl: string | null;
  uploadedUrl: string | null;
  uploading: boolean;
  progress: number;
  error: string | null;
  handleFileSelect: (file: File) => void;
  clearImage: () => void;
}

/**
 * Hook simplifié pour uploader une image de post vers Supabase Storage.
 * Contrairement à useImageUpload, pas d'étape "confirm" (pas de champ profil à mettre à jour).
 * L'URL publique est retournée directement après l'upload.
 */
export function usePostImageUpload(): UsePostImageUploadReturn {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<XMLHttpRequest | null>(null);

  const clearImage = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setUploadedUrl(null);
    setError(null);
    setProgress(0);
  }, [previewUrl]);

  const uploadToStorage = useCallback((signedUrl: string, file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      abortRef.current = xhr;

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        xhr.status >= 200 && xhr.status < 300
          ? resolve()
          : reject(new Error("storageUploadFailed"));
      });

      xhr.addEventListener("error", () => reject(new Error("storageUploadFailed")));
      xhr.open("PUT", signedUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);

      if (!isAllowedMimeType(file.type)) {
        setError("invalidFormat");
        return;
      }

      if (!isValidFileSize(file.size) || file.size > MAX_FILE_SIZE_BYTES) {
        setError("fileTooLarge");
        return;
      }

      // Show local preview immediately
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setUploading(true);
      setProgress(0);

      try {
        // Step 1: Get signed upload URL
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            context: "post-images",
            contentType: file.type,
            fileSize: file.size,
          }),
        });

        if (!response.ok) throw new Error("presignedFailed");

        const { signedUrl, publicUrl }: UploadResponse = await response.json();

        // Step 2: Upload directly to Supabase Storage
        await uploadToStorage(signedUrl, file);

        setUploadedUrl(publicUrl);
      } catch (err) {
        const message = err instanceof Error ? err.message : "uploadError";
        setError(message);
        URL.revokeObjectURL(objectUrl);
        setPreviewUrl(null);
      } finally {
        setUploading(false);
        abortRef.current = null;
      }
    },
    [uploadToStorage]
  );

  return {
    previewUrl,
    uploadedUrl,
    uploading,
    progress,
    error,
    handleFileSelect,
    clearImage,
  };
}
