import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// vi.hoisted runs before vi.mock hoisting — safe to reference in mock factories
const { mockCreateSignedUploadUrl, mockRemove, mockFrom } = vi.hoisted(() => {
  const mockCreateSignedUploadUrl = vi.fn();
  const mockRemove = vi.fn();
  const mockFrom = vi.fn(() => ({
    createSignedUploadUrl: mockCreateSignedUploadUrl,
    remove: mockRemove,
  }));
  return { mockCreateSignedUploadUrl, mockRemove, mockFrom };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    storage: { from: mockFrom },
  })),
}));

vi.mock("@/lib/utils/uploadUtils", () => ({
  generateStoragePath: vi.fn(),
  getBucketName: vi.fn(),
  extractStoragePathFromUrl: vi.fn(),
}));

import { generateSignedUploadUrl, deleteFile } from "@/lib/services/uploadService";
import {
  generateStoragePath,
  getBucketName,
  extractStoragePathFromUrl,
} from "@/lib/utils/uploadUtils";
import type { SignedUploadUrlParams } from "@/types/upload";

const mockedGenerateStoragePath = vi.mocked(generateStoragePath);
const mockedGetBucketName = vi.mocked(getBucketName);
const mockedExtractStoragePathFromUrl = vi.mocked(extractStoragePathFromUrl);

const SUPABASE_URL = "https://test-project.supabase.co";
const SERVICE_ROLE_KEY = "test-service-role-key";
const FAKE_STORAGE_PATH = "user-123/1700000000-abc123.webp";
const FAKE_SIGNED_URL =
  "https://test-project.supabase.co/storage/v1/upload/sign/avatars/user-123/1700000000-abc123.webp?token=abc";
const FAKE_BUCKET = "avatars";

const VALID_PARAMS: SignedUploadUrlParams = {
  context: "avatars",
  userId: "user-123",
  contentType: "image/webp",
  extension: "webp",
};

describe("uploadService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_ROLE_KEY;

    mockedGetBucketName.mockReturnValue(FAKE_BUCKET);
    mockedGenerateStoragePath.mockReturnValue(FAKE_STORAGE_PATH);
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  /** Validates: Requirements 9.1 */
  describe("generateSignedUploadUrl", () => {
    beforeEach(() => {
      mockCreateSignedUploadUrl.mockResolvedValue({
        data: { signedUrl: FAKE_SIGNED_URL, token: "abc", path: FAKE_STORAGE_PATH },
        error: null,
      });
    });

    it("should return signedUrl, publicUrl, and storagePath on success", async () => {
      const result = await generateSignedUploadUrl(VALID_PARAMS);

      expect(result).toEqual({
        signedUrl: FAKE_SIGNED_URL,
        publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${FAKE_BUCKET}/${FAKE_STORAGE_PATH}`,
        storagePath: FAKE_STORAGE_PATH,
      });
    });

    it("should call getBucketName with the correct context", async () => {
      await generateSignedUploadUrl(VALID_PARAMS);

      expect(mockedGetBucketName).toHaveBeenCalledWith("avatars");
    });

    it("should call generateStoragePath with correct userId and extension", async () => {
      await generateSignedUploadUrl(VALID_PARAMS);

      expect(mockedGenerateStoragePath).toHaveBeenCalledWith("user-123", "webp");
    });

    it("should call createSignedUploadUrl with the correct path", async () => {
      await generateSignedUploadUrl(VALID_PARAMS);

      expect(mockFrom).toHaveBeenCalledWith(FAKE_BUCKET);
      expect(mockCreateSignedUploadUrl).toHaveBeenCalledWith(FAKE_STORAGE_PATH);
    });

    it("should construct publicUrl in the correct Supabase format", async () => {
      const result = await generateSignedUploadUrl(VALID_PARAMS);

      const expectedUrl = `${SUPABASE_URL}/storage/v1/object/public/${FAKE_BUCKET}/${FAKE_STORAGE_PATH}`;
      expect(result.publicUrl).toBe(expectedUrl);
    });

    it("should throw when createSignedUploadUrl returns an error", async () => {
      mockCreateSignedUploadUrl.mockResolvedValue({
        data: null,
        error: { message: "Bucket not found" },
      });

      await expect(generateSignedUploadUrl(VALID_PARAMS)).rejects.toThrow(
        "Failed to create signed upload URL: Bucket not found"
      );
    });

    it("should throw with unknown error when data is null without error", async () => {
      mockCreateSignedUploadUrl.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(generateSignedUploadUrl(VALID_PARAMS)).rejects.toThrow(
        "Failed to create signed upload URL: Unknown error"
      );
    });
  });

  /** Validates: Requirements 9.1 */
  describe("deleteFile", () => {
    const VALID_FILE_URL = `${SUPABASE_URL}/storage/v1/object/public/avatars/user-123/1700000000-abc123.webp`;

    it("should call remove with the correct path when URL is valid", async () => {
      mockedExtractStoragePathFromUrl.mockReturnValue({
        bucket: FAKE_BUCKET,
        path: FAKE_STORAGE_PATH,
      });
      mockRemove.mockResolvedValue({ error: null });

      await deleteFile(VALID_FILE_URL);

      expect(mockFrom).toHaveBeenCalledWith(FAKE_BUCKET);
      expect(mockRemove).toHaveBeenCalledWith([FAKE_STORAGE_PATH]);
    });

    it("should log warning and return when URL extraction returns null", async () => {
      mockedExtractStoragePathFromUrl.mockReturnValue(null);
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      await deleteFile("https://invalid-url.com/file.webp");

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Could not extract storage path")
      );
      expect(mockRemove).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it("should throw when remove returns an error", async () => {
      mockedExtractStoragePathFromUrl.mockReturnValue({
        bucket: FAKE_BUCKET,
        path: FAKE_STORAGE_PATH,
      });
      mockRemove.mockResolvedValue({
        error: { message: "Permission denied" },
      });

      await expect(deleteFile(VALID_FILE_URL)).rejects.toThrow(
        "Failed to delete file: Permission denied"
      );
    });
  });
});
