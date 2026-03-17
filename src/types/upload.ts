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
