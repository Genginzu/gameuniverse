import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// --- Mocks ---

const mockGetUser = vi.fn(() => Promise.resolve({ data: { user: null }, error: null }));

const mockSelectEqSingle = vi.fn();
const mockUpdateEqSelectSingle = vi.fn();

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: vi.fn((table: string) => {
    // We need to distinguish select-only (GET current profile) from update chains
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

vi.mock("../../../../src/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock("../../../../src/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockDeleteFile = vi.fn();
vi.mock("../../../../src/lib/services/uploadService", () => ({
  deleteFile: (...args: unknown[]) => mockDeleteFile(...args),
}));

import { POST } from "../../../../src/app/api/upload/confirm/route";

const mockUser = { id: "user-uuid-123", email: "player@example.com" };
const validPublicUrl =
  "https://gameuniverse-uploads.s3.eu-west-3.amazonaws.com/public/avatars/user-uuid-123/1700000000-abc123.webp";
const oldAvatarUrl =
  "https://gameuniverse-uploads.s3.eu-west-3.amazonaws.com/public/avatars/user-uuid-123/1699000000-old123.webp";

function createConfirmRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/upload/confirm", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("/api/upload/confirm POST", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockDeleteFile.mockReset();
    mockSelectEqSingle.mockReset();
    mockUpdateEqSelectSingle.mockReset();
    mockSupabase.from.mockClear();
  });

  it("should return 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const request = createConfirmRequest({
      context: "avatars",
      publicUrl: validPublicUrl,
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 400 for invalid context", async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    const request = createConfirmRequest({
      context: "invalid",
      publicUrl: validPublicUrl,
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 for missing publicUrl", async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    const request = createConfirmRequest({ context: "avatars" });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid publicUrl (not a URL)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    const request = createConfirmRequest({
      context: "avatars",
      publicUrl: "not-a-url",
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should return 200 with success and profile on successful confirmation", async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
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
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockSelectEqSingle.mockResolvedValue({
      data: { banner_url: null },
      error: null,
    });
    const updatedProfile = {
      id: mockUser.id,
      avatar_url: null,
      banner_url: validPublicUrl,
    };
    mockUpdateEqSelectSingle.mockResolvedValue({
      data: updatedProfile,
      error: null,
    });

    const request = createConfirmRequest({
      context: "banners",
      publicUrl: validPublicUrl,
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.profile.banner_url).toBe(validPublicUrl);
  });

  it("should delete old file from S3 when replacing an existing image", async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
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
    // Wait for fire-and-forget promise to settle
    await new Promise((r) => setTimeout(r, 10));
    expect(mockDeleteFile).toHaveBeenCalledWith(oldAvatarUrl);
  });

  it("should NOT delete old file when there is no previous image", async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
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

    await new Promise((r) => setTimeout(r, 10));
    expect(mockDeleteFile).not.toHaveBeenCalled();
  });

  it("should rollback (delete new file from S3) when profile update fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
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
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockSelectEqSingle.mockResolvedValue({
      data: { avatar_url: null },
      error: null,
    });
    mockUpdateEqSelectSingle.mockResolvedValue({
      data: null,
      error: { message: "DB update failed" },
    });
    mockDeleteFile.mockRejectedValue(new Error("S3 delete also failed"));

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
