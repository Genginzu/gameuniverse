import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock Supabase auth
const mockGetUser = vi.fn(() => Promise.resolve({ data: { user: null }, error: null }));

const mockSupabase = {
  auth: { getUser: mockGetUser },
};

vi.mock("../../../../src/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Mock logger to avoid console noise
vi.mock("../../../../src/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock upload service
const mockGeneratePresignedUrl = vi.fn();
vi.mock("../../../../src/lib/services/uploadService", () => ({
  generatePresignedUrl: (...args: unknown[]) => mockGeneratePresignedUrl(...args),
}));

import { POST } from "../../../../src/app/api/upload/route";

const mockUser = { id: "user-uuid-123", email: "player@example.com" };

function createUploadRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/upload", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("/api/upload POST", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockGeneratePresignedUrl.mockReset();
  });

  it("should return 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const request = createUploadRequest({
      context: "avatars",
      contentType: "image/png",
      fileSize: 1000,
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return presigned URL for valid request", async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockGeneratePresignedUrl.mockResolvedValue({
      presignedUrl: "https://s3.example.com/presigned",
      publicUrl: "https://s3.example.com/public/avatars/user-uuid-123/file.png",
      s3Key: "public/avatars/user-uuid-123/file.png",
    });

    const request = createUploadRequest({
      context: "avatars",
      contentType: "image/png",
      fileSize: 2000,
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.presignedUrl).toBe("https://s3.example.com/presigned");
    expect(data.publicUrl).toBe("https://s3.example.com/public/avatars/user-uuid-123/file.png");
  });

  it("should call generatePresignedUrl with correct params", async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockGeneratePresignedUrl.mockResolvedValue({
      presignedUrl: "https://s3.example.com/presigned",
      publicUrl: "https://s3.example.com/public/banners/user-uuid-123/file.webp",
      s3Key: "public/banners/user-uuid-123/file.webp",
    });

    const request = createUploadRequest({
      context: "banners",
      contentType: "image/webp",
      fileSize: 3000,
    });
    await POST(request);

    expect(mockGeneratePresignedUrl).toHaveBeenCalledWith({
      context: "banners",
      userId: "user-uuid-123",
      contentType: "image/webp",
      extension: "webp",
    });
  });

  it("should return 400 for invalid context", async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    const request = createUploadRequest({
      context: "invalid",
      contentType: "image/png",
      fileSize: 1000,
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid content type", async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    const request = createUploadRequest({
      context: "avatars",
      contentType: "text/plain",
      fileSize: 1000,
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 for file size exceeding 5 MB", async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    const request = createUploadRequest({
      context: "avatars",
      contentType: "image/png",
      fileSize: 6 * 1024 * 1024,
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 for missing fields", async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    const request = createUploadRequest({ context: "avatars" });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should return 503 when S3 service fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockGeneratePresignedUrl.mockRejectedValue(new Error("S3 connection failed"));

    const request = createUploadRequest({
      context: "avatars",
      contentType: "image/jpeg",
      fileSize: 1000,
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe("Service temporarily unavailable");
  });
});
