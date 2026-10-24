import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";

const PLAYER_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const TOKEN = "tok-123";

const { mockAcceptInvitation } = vi.hoisted(() => ({
  mockAcceptInvitation: vi.fn(),
}));

const routeEnv = useTestRouteEnvironment({ signedInAs: testUser("user", { id: PLAYER_ID }) });

vi.mock("@/lib/services/groupInvitationsServerService", () => ({
  GroupInvitationsServerService: { acceptInvitation: mockAcceptInvitation },
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from "@/app/api/invitations/[token]/accept/route";

function makeParams(token = TOKEN): { params: Promise<{ token: string }> } {
  return { params: Promise.resolve({ token }) };
}

function acceptRequest() {
  return new NextRequest(`http://localhost/api/invitations/${TOKEN}/accept`, { method: "POST" });
}

describe("/api/invitations/[token]/accept — POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAcceptInvitation.mockResolvedValue(undefined);
  });

  it("returns 200 on success", async () => {
    const res = await POST(acceptRequest(), makeParams());

    expect(res.status).toBe(200);
    expect(mockAcceptInvitation).toHaveBeenCalledWith(TOKEN, PLAYER_ID);
  });

  it("returns 401 when not authenticated", async () => {
    routeEnv.signOut();
    const res = await POST(acceptRequest(), makeParams());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Authentication required", code: "unauthorized" });
  });

  it("returns 404 when the invitation is not found", async () => {
    mockAcceptInvitation.mockRejectedValue(new Error("Invitation not found"));
    const res = await POST(acceptRequest(), makeParams());

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Invitation not found", code: "not_found" });
  });

  it("returns 403 when the invitation is not addressed to the caller", async () => {
    mockAcceptInvitation.mockRejectedValue(new Error("This invitation is not addressed to you"));
    const res = await POST(acceptRequest(), makeParams());

    expect(res.status).toBe(403);
  });

  it("returns 409 when the group has reached the member limit", async () => {
    mockAcceptInvitation.mockRejectedValue(
      new Error("This group has reached the maximum of 50 members")
    );
    const res = await POST(acceptRequest(), makeParams());

    expect(res.status).toBe(409);
  });

  it("returns 409 when the invitation has expired", async () => {
    mockAcceptInvitation.mockRejectedValue(new Error("This invitation has expired"));
    const res = await POST(acceptRequest(), makeParams());

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "This invitation has expired", code: "conflict" });
  });

  it("returns a generic 500 on an unexpected failure", async () => {
    mockAcceptInvitation.mockRejectedValue(new Error("DB down"));
    const res = await POST(acceptRequest(), makeParams());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal server error", code: "internal" });
  });
});
