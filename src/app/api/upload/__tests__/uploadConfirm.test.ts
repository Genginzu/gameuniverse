import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";

// --- Mocks ---

const mockSelectEqSingle = vi.fn();
const mockUpdateEqSelectSingle = vi.fn();

const mockSupabase = {
  from: vi.fn((table: string) => {
    void table;
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSelectEqSingle,
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: mockUpdateEqSelectSingle,
          })),
        })),
      })),
    };
  }),
};

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockDeleteFile = vi.fn();
vi.mock("@/lib/services/uploadService", () => ({
  deleteFile: (...args: unknown[]) => mockDeleteFile(...args),
}));

import { POST } from "@/app/api/upload/confirm/route";

const routeEnv = useTestRouteEnvironment();
const mockUser = testUser("user", { id: "user-uuid-123", email: "player@example.com" });
const validPublicUrl =
  "https://test-project.supabase.co/storage/v1/object/public/avatars/user-uuid-123/1700000000-abc123.webp";
const oldAvatarUrl =
  "https://test-project.supabase.co/storage/v1/object/public/avatars/user-uuid-123/1699000000-old123.webp";

function createConfirmRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/upload/confirm", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("/api/upload/confirm POST", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test-project.supabase.co");
    mockDeleteFile.mockReset();
    mockSelectEqSingle.mockReset();
    mockUpdateEqSelectSingle.mockReset();
    mockSupabase.from.mockClear();
    routeEnv.signIn(mockUser);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    ["suspended", () => routeEnv.suspend("2030-01-01T00:00:00Z"), 403],
    ["rate_limited", () => routeEnv.exceedRateLimit(60), 429],
  ])("should refuse with %s before touching the profile", async (code, arrange, status) => {
    arrange();

    const response = await POST(
      createConfirmRequest({ context: "avatars", publicUrl: validPublicUrl })
    );

    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ code });
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("should return 401 when user is not authenticated", async () => {
    routeEnv.signOut();

    const request = createConfirmRequest({
      context: "avatars",
      publicUrl: validPublicUrl,
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Authentication required", code: "unauthorized" });
  });

  it("should return 400 for invalid context", async () => {

    const request = createConfirmRequest({
      context: "invalid",
      publicUrl: validPublicUrl,
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 for missing publicUrl", async () => {

    const request = createConfirmRequest({ context: "avatars" });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid publicUrl (not a Supabase Storage URL)", async () => {

    const request = createConfirmRequest({
      context: "avatars",
      publicUrl: "https://example.com/not-a-storage-url",
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it.each([
    [
      "another user's file",
      "https://test-project.supabase.co/storage/v1/object/public/avatars/victim-uuid/1700000000-abc.webp",
    ],
    [
      "a file from another bucket",
      "https://test-project.supabase.co/storage/v1/object/public/post-images/user-uuid-123/1700000000-abc.webp",
    ],
    [
      "an external host",
      "https://evil.test/storage/v1/object/public/avatars/user-uuid-123/1700000000-abc.webp",
    ],
    [
      "a path traversal",
      "https://test-project.supabase.co/storage/v1/object/public/avatars/user-uuid-123/../victim-uuid/a.webp",
    ],
  ])("should return 400 and touch nothing for %s", async (_label, publicUrl) => {

    const response = await POST(createConfirmRequest({ context: "avatars", publicUrl }));

    expect(response.status).toBe(400);
    expect(mockUpdateEqSelectSingle).not.toHaveBeenCalled();
    expect(mockDeleteFile).not.toHaveBeenCalled();
  });

  it("should not delete a previous avatar that does not belong to the user", async () => {
    mockSelectEqSingle.mockResolvedValue({
      data: {
        avatar_url:
          "https://test-project.supabase.co/storage/v1/object/public/avatars/victim-uuid/old.webp",
      },
      error: null,
    });
    mockUpdateEqSelectSingle.mockResolvedValue({
      data: { id: mockUser.id, avatar_url: validPublicUrl },
      error: null,
    });

    const response = await POST(
      createConfirmRequest({ context: "avatars", publicUrl: validPublicUrl })
    );

    expect(response.status).toBe(200);
    expect(mockDeleteFile).not.toHaveBeenCalled();
  });

  it("should return 200 with success and profile on successful confirmation", async () => {
    mockSelectEqSingle.mockResolvedValue({
      data: { avatar_url: null },
      error: null,
    });
    const updatedProfile = {
      id: mockUser.id,
      avatar_url: validPublicUrl,
      banner_url: null,
    };
    mockUpdateEqSelectSingle.mockResolvedValue({
      data: updatedProfile,
      error: null,
    });

    const request = createConfirmRequest({
      context: "avatars",
      publicUrl: validPublicUrl,
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.profile).toEqual(updatedProfile);
  });

  it("should update banner_url when context is banners", async () => {
    mockSelectEqSingle.mockResolvedValue({
      data: { banner_url: null },
      error: null,
    });
    const bannerUrl =
      "https://test-project.supabase.co/storage/v1/object/public/banners/user-uuid-123/1700000000-abc123.webp";
    const updatedProfile = {
      id: mockUser.id,
      avatar_url: null,
      banner_url: bannerUrl,
    };
    mockUpdateEqSelectSingle.mockResolvedValue({
      data: updatedProfile,
      error: null,
    });

    const request = createConfirmRequest({
      context: "banners",
      publicUrl: bannerUrl,
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.profile.banner_url).toBe(bannerUrl);
  });

  it("should delete old file from storage when replacing an existing image", async () => {
    mockSelectEqSingle.mockResolvedValue({
      data: { avatar_url: oldAvatarUrl },
      error: null,
    });
    mockUpdateEqSelectSingle.mockResolvedValue({
      data: { id: mockUser.id, avatar_url: validPublicUrl },
      error: null,
    });
    mockDeleteFile.mockResolvedValue(undefined);

    const request = createConfirmRequest({
      context: "avatars",
      publicUrl: validPublicUrl,
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockDeleteFile).toHaveBeenCalledWith(oldAvatarUrl);
  });

  it("should NOT delete old file when there is no previous image", async () => {
    mockSelectEqSingle.mockResolvedValue({
      data: { avatar_url: null },
      error: null,
    });
    mockUpdateEqSelectSingle.mockResolvedValue({
      data: { id: mockUser.id, avatar_url: validPublicUrl },
      error: null,
    });

    const request = createConfirmRequest({
      context: "avatars",
      publicUrl: validPublicUrl,
    });
    await POST(request);

    expect(mockDeleteFile).not.toHaveBeenCalled();
  });

  it("should rollback (delete new file) when profile update fails", async () => {
    mockSelectEqSingle.mockResolvedValue({
      data: { avatar_url: null },
      error: null,
    });
    mockUpdateEqSelectSingle.mockResolvedValue({
      data: null,
      error: { message: "DB update failed" },
    });
    mockDeleteFile.mockResolvedValue(undefined);

    const request = createConfirmRequest({
      context: "avatars",
      publicUrl: validPublicUrl,
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
    expect(mockDeleteFile).toHaveBeenCalledWith(validPublicUrl);
  });

  it("should handle rollback failure gracefully and still return 500", async () => {
    mockSelectEqSingle.mockResolvedValue({
      data: { avatar_url: null },
      error: null,
    });
    mockUpdateEqSelectSingle.mockResolvedValue({
      data: null,
      error: { message: "DB update failed" },
    });
    mockDeleteFile.mockRejectedValue(new Error("Storage delete also failed"));

    const request = createConfirmRequest({
      context: "avatars",
      publicUrl: validPublicUrl,
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
    expect(mockDeleteFile).toHaveBeenCalledWith(validPublicUrl);
  });
});
