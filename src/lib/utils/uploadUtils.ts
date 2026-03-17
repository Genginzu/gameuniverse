import type { UploadContext } from "@/types/upload";

const SUPABASE_PUBLIC_STORAGE_PREFIX = "/storage/v1/object/public/";

/**
 * Generates a unique storage path following the pattern:
 * `{userId}/{timestamp}-{randomId}.{extension}`
 *
 * The bucket is determined separately via `getBucketName`.
 */
export function generateStoragePath(userId: string, extension: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 10);
  return `${userId}/${timestamp}-${randomId}.${extension}`;
}

/**
 * Resolves the Supabase Storage bucket name from the upload context.
 */
export function getBucketName(context: UploadContext): string {
  const bucketMap: Record<UploadContext, string> = {
    avatars: "avatars",
    banners: "banners",
  };
  return bucketMap[context];
}

/**
 * Extracts the bucket name and storage path from a Supabase Storage public URL.
 *
 * Expected format:
 * `https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}`
 *
 * Returns `null` if the URL doesn't match the expected Supabase Storage format.
 */
export function extractStoragePathFromUrl(url: string): { bucket: string; path: string } | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  const prefix = `${supabaseUrl}${SUPABASE_PUBLIC_STORAGE_PREFIX}`;
  if (!url.startsWith(prefix)) return null;

  const remainder = url.slice(prefix.length);
  const slashIndex = remainder.indexOf("/");
  if (slashIndex <= 0) return null;

  const bucket = remainder.substring(0, slashIndex);
  const path = remainder.substring(slashIndex + 1);
  if (!path) return null;

  return { bucket, path };
}

/**
 * Maps a MIME type to its file extension.
 * Returns 'bin' for unknown types.
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExtension: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return mimeToExtension[mimeType] ?? "bin";
}
