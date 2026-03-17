import { z } from "zod";

import {
  ALLOWED_CONTEXTS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  type AllowedMimeType,
  type UploadContext,
} from "@/types/upload";

export const uploadRequestSchema = z.object({
  context: z.enum(["avatars", "banners"]),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
});

export const uploadConfirmSchema = z.object({
  context: z.enum(["avatars", "banners"]),
  publicUrl: z
    .string()
    .url()
    .refine((url) => url.includes("/storage/v1/object/public/"), {
      message: "URL must be a valid Supabase Storage public URL",
    }),
});

export type UploadRequestInput = z.infer<typeof uploadRequestSchema>;
export type UploadConfirmInput = z.infer<typeof uploadConfirmSchema>;

/** Checks if the MIME type is in ALLOWED_MIME_TYPES */
export function isAllowedMimeType(mimeType: string): mimeType is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

/** Checks if the context is in ALLOWED_CONTEXTS */
export function isAllowedContext(context: string): context is UploadContext {
  return (ALLOWED_CONTEXTS as readonly string[]).includes(context);
}

/** Checks if fileSize > 0 and <= MAX_FILE_SIZE_BYTES */
export function isValidFileSize(fileSize: number): boolean {
  return fileSize > 0 && fileSize <= MAX_FILE_SIZE_BYTES;
}
