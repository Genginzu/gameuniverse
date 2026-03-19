// Types partagés pour le système d'upload d'images (avatar, bannière)

import type { Profile } from "@/types/profile";

export type UploadContext = "avatars" | "banners";

export const ALLOWED_CONTEXTS: UploadContext[] = ["avatars", "banners"];

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

export const CONTEXT_TO_PROFILE_FIELD: Record<UploadContext, "avatar_url" | "banner_url"> = {
  avatars: "avatar_url",
  banners: "banner_url",
};

export interface SignedUploadUrlParams {
  context: UploadContext;
  userId: string;
  contentType: string;
  extension: string;
}

export interface SignedUploadUrlResult {
  signedUrl: string;
  publicUrl: string;
  storagePath: string;
}

export interface UploadRequest {
  context: UploadContext;
  contentType: string;
  fileSize: number;
}

export interface UploadResponse {
  signedUrl: string;
  publicUrl: string;
}

export interface UploadConfirmRequest {
  context: UploadContext;
  publicUrl: string;
}

export interface UploadConfirmResponse {
  success: boolean;
  profile: Profile;
}

/** Dimensions de sortie par contexte d'upload */
export const OUTPUT_DIMENSIONS: Record<UploadContext, { width: number; height: number }> = {
  avatars: { width: 256, height: 256 },
  banners: { width: 1280, height: 400 },
};

/** Configuration WebP par défaut pour le crop */
export const CROP_OUTPUT_FORMAT = "image/webp";
export const CROP_OUTPUT_QUALITY = 0.9;

/** Limites de zoom */
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 3;
export const ZOOM_STEP = 0.01;
