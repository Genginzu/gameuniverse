import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const PLAYER_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const TOKEN = "tok-123";

const { mockAcceptInvitation, mockGetUser } = vi.hoisted(() => ({
  mockAcceptInvitation: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock("@/lib/services/groupInvitationsServerService", () => ({
  GroupInvitationsServerService: { acceptInvitation: mockAcceptInvitation },
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from "@/app/api/invitations/[token]/accept/route";

function makeParams(token = TOKEN): { params: Promise<{ token: string }> } {
  return { params: Promise.resolve({ token }) };
}

describe("/api/invitations/[token]/accept — POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: PLAYER_ID } }, error: null });
    mockAcceptInvitation.mockResolvedValue(undefined);
  });

  it("returns 200 on success", async () => {
    const req = new NextRequest(`http://localhost/api/invitations/${TOKEN}/accept`, {
      method: "POST",
    });
    const res = await POST(req, makeParams());

    expect(res.status).toBe(200);
    expect(mockAcceptInvitation).toHaveBeenCalledWith(TOKEN, PLAYER_ID);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const req = new NextRequest(`http://localhost/api/invitations/${TOKEN}/accept`, {
      method: "POST",
    });
    const res = await POST(req, makeParams());

    expect(res.status).toBe(401);
  });

  it("returns 404 when the invitation is not found", async () => {
    mockAcceptInvitation.mockRejectedValue(new Error("Invitation not found"));
    const req = new NextRequest(`http://localhost/api/invitations/${TOKEN}/accept`, {
      method: "POST",
    });
    const res = await POST(req, makeParams());

    expect(res.status).toBe(404);
  });

  it("returns 403 when the invitation is not addressed to the caller", async () => {
    mockAcceptInvitation.mockRejectedValue(new Error("This invitation is not addressed to you"));
    const req = new NextRequest(`http://localhost/api/invitations/${TOKEN}/accept`, {
      method: "POST",
    });
    const res = await POST(req, makeParams());

    expect(res.status).toBe(403);
  });

  it("returns 409 when the group has reached the member limit", async () => {
    mockAcceptInvitation.mockRejectedValue(
      new Error("This group has reached the maximum of 50 members")
    );
    const req = new NextRequest(`http://localhost/api/invitations/${TOKEN}/accept`, {
      method: "POST",
    });
    const res = await POST(req, makeParams());

    expect(res.status).toBe(409);
  });

  it("returns 409 when the invitation has expired", async () => {
    mockAcceptInvitation.mockRejectedValue(new Error("This invitation has expired"));
    const req = new NextRequest(`http://localhost/api/invitations/${TOKEN}/accept`, {
      method: "POST",
    });
    const res = await POST(req, makeParams());

    expect(res.status).toBe(409);
  });
});
