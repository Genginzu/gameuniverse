import { describe, it, expect } from "vitest";

import {
  uploadRequestSchema,
  uploadConfirmSchema,
  isAllowedMimeType,
  isAllowedContext,
  isValidFileSize,
} from "@/lib/validations/uploadValidation";
import { MAX_FILE_SIZE_BYTES } from "@/types/upload";

describe("uploadRequestSchema", () => {
  it("accepts a valid upload request", () => {
    const result = uploadRequestSchema.safeParse({
      context: "avatars",
      contentType: "image/png",
      fileSize: 1024,
    });
    expect(result.success).toBe(true);
  });

  it("accepts max file size exactly", () => {
    const result = uploadRequestSchema.safeParse({
      context: "banners",
      contentType: "image/webp",
      fileSize: MAX_FILE_SIZE_BYTES,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid context", () => {
    const result = uploadRequestSchema.safeParse({
      context: "photos",
      contentType: "image/png",
      fileSize: 1024,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid content type", () => {
    const result = uploadRequestSchema.safeParse({
      context: "avatars",
      contentType: "application/pdf",
      fileSize: 1024,
    });
    expect(result.success).toBe(false);
  });

  it("rejects file size exceeding 5 Mo", () => {
    const result = uploadRequestSchema.safeParse({
      context: "avatars",
      contentType: "image/jpeg",
      fileSize: MAX_FILE_SIZE_BYTES + 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero file size", () => {
    const result = uploadRequestSchema.safeParse({
      context: "avatars",
      contentType: "image/jpeg",
      fileSize: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative file size", () => {
    const result = uploadRequestSchema.safeParse({
      context: "avatars",
      contentType: "image/jpeg",
      fileSize: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer file size", () => {
    const result = uploadRequestSchema.safeParse({
      context: "avatars",
      contentType: "image/jpeg",
      fileSize: 1024.5,
    });
    expect(result.success).toBe(false);
  });
});

describe("uploadConfirmSchema", () => {
  it("accepts a valid Supabase Storage URL", () => {
    const result = uploadConfirmSchema.safeParse({
      context: "avatars",
      publicUrl:
        "https://test-project.supabase.co/storage/v1/object/public/avatars/user-123/1700000000-abc123.webp",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid Supabase Storage URL for banners", () => {
    const result = uploadConfirmSchema.safeParse({
      context: "banners",
      publicUrl:
        "https://test-project.supabase.co/storage/v1/object/public/banners/user-456/1700000000-def456.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an S3 URL", () => {
    const result = uploadConfirmSchema.safeParse({
      context: "avatars",
      publicUrl: "https://bucket.s3.amazonaws.com/public/avatars/uid/file.webp",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a URL without Supabase Storage path", () => {
    const result = uploadConfirmSchema.safeParse({
      context: "avatars",
      publicUrl: "https://example.com/file.png",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid context", () => {
    const result = uploadConfirmSchema.safeParse({
      context: "collections",
      publicUrl:
        "https://test-project.supabase.co/storage/v1/object/public/avatars/user-123/file.webp",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-URL string", () => {
    const result = uploadConfirmSchema.safeParse({
      context: "banners",
      publicUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("isAllowedMimeType", () => {
  it.each(["image/jpeg", "image/png", "image/webp", "image/gif"])("returns true for %s", (mime) => {
    expect(isAllowedMimeType(mime)).toBe(true);
  });

  it.each(["application/pdf", "text/plain", "image/svg+xml", "video/mp4", ""])(
    "returns false for %s",
    (mime) => {
      expect(isAllowedMimeType(mime)).toBe(false);
    }
  );
});

describe("isAllowedContext", () => {
  it.each(["avatars", "banners"])("returns true for %s", (ctx) => {
    expect(isAllowedContext(ctx)).toBe(true);
  });

  it.each(["photos", "collections", "profile", ""])("returns false for %s", (ctx) => {
    expect(isAllowedContext(ctx)).toBe(false);
  });
});

describe("isValidFileSize", () => {
  it("returns true for 1 byte", () => {
    expect(isValidFileSize(1)).toBe(true);
  });

  it("returns true for exactly MAX_FILE_SIZE_BYTES", () => {
    expect(isValidFileSize(MAX_FILE_SIZE_BYTES)).toBe(true);
  });

  it("returns false for 0", () => {
    expect(isValidFileSize(0)).toBe(false);
  });

  it("returns false for negative values", () => {
    expect(isValidFileSize(-1)).toBe(false);
  });

  it("returns false for size exceeding max", () => {
    expect(isValidFileSize(MAX_FILE_SIZE_BYTES + 1)).toBe(false);
  });
});
