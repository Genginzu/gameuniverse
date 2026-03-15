import type { UploadContext } from "@/types/upload";

const S3_BUCKET_NAME = "gameuniverse-uploads";
const S3_REGION = "eu-west-3";
const S3_PUBLIC_URL_PREFIX = `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/`;

/**
 * Generates a unique S3 key following the pattern:
 * `public/{context}/{userId}/{timestamp}-{randomId}.{extension}`
 */
export function generateS3Key(context: UploadContext, userId: string, extension: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 10);
  return `public/${context}/${userId}/${timestamp}-${randomId}.${extension}`;
}

/**
 * Extracts the S3 key from a public URL.
 * Returns null if the URL doesn't match the expected bucket URL prefix.
 */
export function extractS3KeyFromUrl(url: string): string | null {
  if (!url.startsWith(S3_PUBLIC_URL_PREFIX)) {
    return null;
  }
  return url.slice(S3_PUBLIC_URL_PREFIX.length);
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
