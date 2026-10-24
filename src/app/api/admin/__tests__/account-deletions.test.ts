import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";
import { useTestRouteEnvironment } from "@/test-helpers/route-environment";

const { adminDb } = vi.hoisted(() => ({
  adminDb: { current: null as ReturnType<typeof createSupabaseQueryMock> | null },
}));

vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: () => adminDb.current!.client }));
vi.mock("@/lib/services/accountPurgeService", () => ({ purgeAccount: vi.fn() }));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const routeEnv = useTestRouteEnvironment({ signedInAs: "admin" });

const { GET } = await import("@/app/api/admin/account-deletions/route");
const { POST, DELETE } = await import("@/app/api/admin/account-deletions/[id]/route");
const { purgeAccount } = await import("@/lib/services/accountPurgeService");

const TARGET = "0f8fad5b-d9cb-469f-a165-70867728950e";

function context(id = TARGET) {
  return { params: Promise.resolve({ id }) };
}

const listRequest = () => new NextRequest("http://localhost/api/admin/account-deletions");
const request = new NextRequest(`http://localhost/api/admin/account-deletions/${TARGET}`);

beforeEach(() => {
  vi.clearAllMocks();
  adminDb.current = createSupabaseQueryMock();
});

describe("admin account deletions", () => {
  it("is reserved to admins", async () => {
    routeEnv.signIn("user");
    expect((await GET(listRequest())).status).toBe(403);
    expect((await POST(request, context())).status).toBe(403);
  });

  it("requires authentication", async () => {
    routeEnv.signOut();
    expect((await GET(listRequest())).status).toBe(401);
    expect((await DELETE(request, context())).status).toBe(401);
  });

  it("lists pending deletions, soonest first", async () => {
    adminDb.current!.enqueue("profiles", {
      data: [
        {
          id: TARGET,
          username: "alice",
          avatar_url: null,
          deletion_requested_at: "2026-10-01T00:00:00Z",
          deletion_scheduled_for: "2026-10-31T00:00:00Z",
        },
      ],
    });

    const body = await (await GET(listRequest())).json();
    expect(body.deletions).toEqual([
      {
        id: TARGET,
        username: "alice",
        avatarUrl: null,
        requestedAt: "2026-10-01T00:00:00Z",
        scheduledFor: "2026-10-31T00:00:00Z",
      },
    ]);
    expect(adminDb.current!.callsFor("profiles", "order")[0]).toEqual([
      "deletion_scheduled_for",
      { ascending: true },
    ]);
  });

  it("purges a pending account on demand", async () => {
    adminDb.current!.enqueue("profiles", {
      data: { deletion_requested_at: "2026-10-01T00:00:00Z", deletion_scheduled_for: "x" },
    });
    vi.mocked(purgeAccount).mockResolvedValue({ userId: TARGET, ok: true });

    const res = await POST(request, context());
    expect(res.status).toBe(200);
    expect(purgeAccount).toHaveBeenCalledWith(TARGET);
  });

  it("never purges an account without a pending deletion", async () => {
    adminDb.current!.enqueue("profiles", { data: { deletion_requested_at: null } });
    const res = await POST(request, context());
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "No pending deletion", code: "not_found" });
    expect(purgeAccount).not.toHaveBeenCalled();
  });

  it("rejects malformed ids", async () => {
    const res = await DELETE(request, context("not-a-uuid"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid id", code: "validation" });
  });

  it("cancels a pending deletion", async () => {
    adminDb.current!.enqueue("profiles", { data: { id: TARGET } });
    const res = await DELETE(request, context());
    expect(res.status).toBe(200);
    expect(adminDb.current!.callsFor("profiles", "update")[0]).toEqual([
      { deletion_requested_at: null, deletion_scheduled_for: null },
    ]);
  });
});
