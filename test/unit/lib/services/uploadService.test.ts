import { describe, it, expect, beforeEach, vi } from "vitest";

// vi.hoisted runs before vi.mock hoisting — safe to reference in mock factories
const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn(),
}));

vi.mock("@aws-sdk/client-s3", () => {
  class MockS3Client {
    send = mockSend;
  }
  return {
    S3Client: MockS3Client,
    PutObjectCommand: vi.fn(),
    DeleteObjectCommand: vi.fn(),
  };
});

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(),
}));

vi.mock("@/lib/utils/uploadUtils", () => ({
  generateS3Key: vi.fn(),
  extractS3KeyFromUrl: vi.fn(),
}));

import { generatePresignedUrl, deleteFile } from "@/lib/services/uploadService";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { generateS3Key, extractS3KeyFromUrl } from "@/lib/utils/uploadUtils";
import type { PresignedUrlParams } from "@/types/upload";

const mockedGetSignedUrl = vi.mocked(getSignedUrl);
const mockedGenerateS3Key = vi.mocked(generateS3Key);
const mockedExtractS3KeyFromUrl = vi.mocked(extractS3KeyFromUrl);
const MockedPutObjectCommand = vi.mocked(PutObjectCommand);
const MockedDeleteObjectCommand = vi.mocked(DeleteObjectCommand);

const VALID_PARAMS: PresignedUrlParams = {
  context: "avatars",
  userId: "user-123",
  contentType: "image/webp",
  extension: "webp",
};

const FAKE_S3_KEY = "public/avatars/user-123/1700000000-abc123.webp";
const FAKE_PRESIGNED_URL = "https://s3.amazonaws.com/presigned?token=abc";

describe("uploadService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGenerateS3Key.mockReturnValue(FAKE_S3_KEY);
    mockedGetSignedUrl.mockResolvedValue(FAKE_PRESIGNED_URL);
  });

  /** Validates: Requirements 1.1, 1.5 */
  describe("generatePresignedUrl", () => {
    it("should return presignedUrl, publicUrl, and s3Key", async () => {
      const result = await generatePresignedUrl(VALID_PARAMS);

      expect(result).toEqual({
        presignedUrl: FAKE_PRESIGNED_URL,
        publicUrl: expect.stringContaining(FAKE_S3_KEY),
        s3Key: FAKE_S3_KEY,
      });
    });

    it("should call generateS3Key with correct params", async () => {
      await generatePresignedUrl(VALID_PARAMS);

      expect(mockedGenerateS3Key).toHaveBeenCalledWith(
        VALID_PARAMS.context,
        VALID_PARAMS.userId,
        VALID_PARAMS.extension
      );
    });

    it("should create PutObjectCommand with correct bucket, key, and contentType", async () => {
      await generatePresignedUrl(VALID_PARAMS);

      expect(MockedPutObjectCommand).toHaveBeenCalledWith({
        Bucket: expect.any(String),
        Key: FAKE_S3_KEY,
        ContentType: VALID_PARAMS.contentType,
      });
    });

    it("should call getSignedUrl with expiresIn 300", async () => {
      await generatePresignedUrl(VALID_PARAMS);

      expect(mockedGetSignedUrl).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
        expiresIn: 300,
      });
    });

    /** Validates: Requirements 7.3 */
    it("should throw when S3 connection fails", async () => {
      mockedGetSignedUrl.mockRejectedValue(new Error("Network error"));

      await expect(generatePresignedUrl(VALID_PARAMS)).rejects.toThrow("Network error");
    });
  });

  /** Validates: Requirements 1.3 */
  describe("deleteFile", () => {
    const VALID_FILE_URL =
      "https://gameuniverse-uploads.s3.eu-west-3.amazonaws.com/public/avatars/user-123/1700000000-abc123.webp";

    it("should call DeleteObjectCommand with correct bucket and key", async () => {
      mockedExtractS3KeyFromUrl.mockReturnValue(FAKE_S3_KEY);
      mockSend.mockResolvedValue({});

      await deleteFile(VALID_FILE_URL);

      expect(MockedDeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: expect.any(String),
        Key: FAKE_S3_KEY,
      });
      expect(mockSend).toHaveBeenCalled();
    });

    it("should log warning and return when URL does not match bucket pattern", async () => {
      mockedExtractS3KeyFromUrl.mockReturnValue(null);
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      await deleteFile("https://other-bucket.com/file.webp");

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Could not extract S3 key"));
      expect(mockSend).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    /** Validates: Requirements 7.3 */
    it("should throw when S3 delete fails", async () => {
      mockedExtractS3KeyFromUrl.mockReturnValue(FAKE_S3_KEY);
      mockSend.mockRejectedValue(new Error("S3 delete failed"));

      await expect(deleteFile(VALID_FILE_URL)).rejects.toThrow("S3 delete failed");
    });
  });
});
