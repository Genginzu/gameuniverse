import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  extractStoragePathFromUrl,
  generateStoragePath,
  getBucketName,
} from "@/lib/utils/uploadUtils";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  type AllowedMimeType,
  type SignedUploadUrlParams,
  type SignedUploadUrlResult,
} from "@/types/upload";

// Lazy-initialized Supabase admin client (service role) to avoid build-time errors
let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase environment variables for admin client");
    }
    _supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin;
}

/**
 * Generates a signed upload URL for direct browser-to-Supabase-Storage upload.
 * Returns the signed URL, the final public URL, and the storage path.
 */
export async function generateSignedUploadUrl(
  params: SignedUploadUrlParams
): Promise<SignedUploadUrlResult> {
  const { context, userId, extension } = params;
  const bucket = getBucketName(context);
  const storagePath = generateStoragePath(userId, extension);

  const { data, error } = await getSupabaseAdmin()
    .storage.from(bucket)
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    throw new Error(`Failed to create signed upload URL: ${error?.message ?? "Unknown error"}`);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;

  return { signedUrl: data.signedUrl, publicUrl, storagePath };
}

/**
 * Deletes a file from Supabase Storage given its public URL.
 * If the path cannot be extracted from the URL, logs a warning and returns.
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  const extracted = extractStoragePathFromUrl(fileUrl);

  if (!extracted) {
    console.warn(`[uploadService] Could not extract storage path from URL: ${fileUrl}`);
    return;
  }

  const { bucket, path } = extracted;
  const { error } = await getSupabaseAdmin().storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Checks whether a MIME type is in the allowed list.
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType);
}

/**
 * Checks whether a file size is within the allowed limit (0 < size <= 5 MB).
 */
export function isValidFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE_BYTES;
}
