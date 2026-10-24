import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";

// Mock logger to avoid console noise
vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock upload service — now uses generateSignedUploadUrl (Supabase Storage)
const mockGenerateSignedUploadUrl = vi.fn();
vi.mock("@/lib/services/uploadService", () => ({
  generateSignedUploadUrl: (...args: unknown[]) => mockGenerateSignedUploadUrl(...args),
}));

import { POST } from "@/app/api/upload/route";

const routeEnv = useTestRouteEnvironment();
const mockUser = testUser("user", { id: "user-uuid-123", email: "player@example.com" });

function createUploadRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/upload", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("/api/upload POST", () => {
  beforeEach(() => {
    mockGenerateSignedUploadUrl.mockReset();
    routeEnv.signIn(mockUser);
  });

  it("should return 429 when the upload rate limit is exceeded", async () => {
    routeEnv.exceedRateLimit(60);

    const response = await POST(
      createUploadRequest({ context: "avatars", contentType: "image/png", fileSize: 1000 })
    );

    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({ code: "rate_limited", retryAfter: 60 });
    expect(mockGenerateSignedUploadUrl).not.toHaveBeenCalled();
  });

  it("should return 401 when user is not authenticated", async () => {
    routeEnv.signOut();

    const request = createUploadRequest({
      context: "avatars",
      contentType: "image/png",
      fileSize: 1000,
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Authentication required", code: "unauthorized" });
  });

  it("should return signed URL for valid request", async () => {
    mockGenerateSignedUploadUrl.mockResolvedValue({
      signedUrl:
        "https://test-project.supabase.co/storage/v1/upload/sign/avatars/user-uuid-123/1700000000-abc123.png",
      publicUrl:
        "https://test-project.supabase.co/storage/v1/object/public/avatars/user-uuid-123/1700000000-abc123.png",
      storagePath: "user-uuid-123/1700000000-abc123.png",
    });

    const request = createUploadRequest({
      context: "avatars",
      contentType: "image/png",
      fileSize: 2000,
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.signedUrl).toBe(
      "https://test-project.supabase.co/storage/v1/upload/sign/avatars/user-uuid-123/1700000000-abc123.png"
    );
    expect(data.publicUrl).toBe(
      "https://test-project.supabase.co/storage/v1/object/public/avatars/user-uuid-123/1700000000-abc123.png"
    );
  });

  it("should call generateSignedUploadUrl with correct params", async () => {
    mockGenerateSignedUploadUrl.mockResolvedValue({
      signedUrl:
        "https://test-project.supabase.co/storage/v1/upload/sign/banners/user-uuid-123/1700000000-abc123.webp",
      publicUrl:
        "https://test-project.supabase.co/storage/v1/object/public/banners/user-uuid-123/1700000000-abc123.webp",
      storagePath: "user-uuid-123/1700000000-abc123.webp",
    });

    const request = createUploadRequest({
      context: "banners",
      contentType: "image/webp",
      fileSize: 3000,
    });
    await POST(request);

    expect(mockGenerateSignedUploadUrl).toHaveBeenCalledWith({
      context: "banners",
      userId: "user-uuid-123",
      contentType: "image/webp",
      extension: "webp",
    });
  });

  it("should return 400 for invalid context", async () => {

    const request = createUploadRequest({
      context: "invalid",
      contentType: "image/png",
      fileSize: 1000,
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid content type", async () => {

    const request = createUploadRequest({
      context: "avatars",
      contentType: "text/plain",
      fileSize: 1000,
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 for file size exceeding 5 MB", async () => {

    const request = createUploadRequest({
      context: "avatars",
      contentType: "image/png",
      fileSize: 6 * 1024 * 1024,
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 for missing fields", async () => {

    const request = createUploadRequest({ context: "avatars" });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should return 503 when storage service fails", async () => {
    mockGenerateSignedUploadUrl.mockRejectedValue(new Error("Storage connection failed"));

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
