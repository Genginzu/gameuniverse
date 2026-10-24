import { describe, test, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";
import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";

const { adminDb, sessionDb } = vi.hoisted(() => ({
  adminDb: { current: null as ReturnType<typeof createSupabaseQueryMock> | null },
  sessionDb: { current: null as ReturnType<typeof createSupabaseQueryMock> | null },
}));

const routeEnv = useTestRouteEnvironment({ signedInAs: "admin" });

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({
    from: (table: string) => sessionDb.current!.client.from(table),
  })),
}));

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => adminDb.current!.client,
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { GET, POST } = await import("@/app/api/admin/disputes/route");
const { PATCH } = await import("@/app/api/admin/disputes/[id]/route");

const SELF_PROMOTED = testUser("user", { user_metadata: { role: "admin" } });

function request(url: string, init?: RequestInit) {
  return new NextRequest(url, init as ConstructorParameters<typeof NextRequest>[1]);
}

const params = { params: Promise.resolve({ id: "d-1" }) };

describe("/api/admin/disputes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminDb.current = createSupabaseQueryMock();
    sessionDb.current = createSupabaseQueryMock();
  });

  test("GET returns 401 when signed out", async () => {
    routeEnv.signOut();
    const res = await GET(request("http://localhost/api/admin/disputes"));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Authentication required", code: "unauthorized" });
  });

  test("GET returns 403 for a user who set role=admin in their own user_metadata", async () => {
    routeEnv.signIn(SELF_PROMOTED);
    const res = await GET(request("http://localhost/api/admin/disputes"));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Admin access required", code: "forbidden" });
    expect(adminDb.current!.calls).toHaveLength(0);
  });

  test("GET lists all disputes through the service-role client", async () => {
    adminDb.current!.enqueue("coaching_disputes", {
      data: [
        {
          id: "d-1",
          session_id: "s-1",
          reason: "no_show",
          description: null,
          status: "open",
          admin_notes: null,
          created_at: "2026-01-01T00:00:00Z",
          resolved_at: null,
          reporter: { username: "alice", avatar_url: null },
          reported: { username: "bob", avatar_url: null },
        },
      ],
    });

    const res = await GET(request("http://localhost/api/admin/disputes"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.disputes[0]).toMatchObject({ id: "d-1", reporter: { username: "alice" } });
    expect(sessionDb.current!.calls).toHaveLength(0);
  });

  test("POST still lets any signed-in user report through their own session", async () => {
    routeEnv.signIn(SELF_PROMOTED);
    sessionDb.current!.enqueue("coaching_disputes", { data: { id: "d-2" } });

    const res = await POST(
      request("http://localhost/api/admin/disputes", {
        method: "POST",
        body: JSON.stringify({ sessionId: "session-1", reportedId: "coach-1", reason: "no_show" }),
      })
    );
    expect(res.status).toBe(201);
    expect(adminDb.current!.calls).toHaveLength(0);
  });

  test("POST requires the coaching session the dispute is about", async () => {
    routeEnv.signIn(SELF_PROMOTED);

    const res = await POST(
      request("http://localhost/api/admin/disputes", {
        method: "POST",
        body: JSON.stringify({ reportedId: "coach-1", reason: "no_show" }),
      })
    );
    expect(res.status).toBe(400);
    expect(sessionDb.current!.calls).toHaveLength(0);
  });

  test("POST returns 401 when signed out", async () => {
    routeEnv.signOut();
    const res = await POST(
      request("http://localhost/api/admin/disputes", {
        method: "POST",
        body: JSON.stringify({ sessionId: "session-1", reportedId: "coach-1", reason: "no_show" }),
      })
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Authentication required", code: "unauthorized" });
  });

  test("POST returns 429 when the report rate limit is exceeded", async () => {
    routeEnv.signIn(SELF_PROMOTED);
    routeEnv.exceedRateLimit(120);
    const res = await POST(
      request("http://localhost/api/admin/disputes", {
        method: "POST",
        body: JSON.stringify({ sessionId: "session-1", reportedId: "coach-1", reason: "no_show" }),
      })
    );
    expect(res.status).toBe(429);
    expect(routeEnv.rateLimitHits).toEqual(["report:user:user-1"]);
    expect(sessionDb.current!.calls).toHaveLength(0);
  });

  test("PATCH returns 403 for a self-promoted user and writes nothing", async () => {
    routeEnv.signIn(SELF_PROMOTED);
    const res = await PATCH(
      request("http://localhost/api/admin/disputes/d-1", {
        method: "PATCH",
        body: JSON.stringify({ action: "resolve" }),
      }),
      params
    );
    expect(res.status).toBe(403);
    expect(adminDb.current!.calls).toHaveLength(0);
  });

  test("PATCH rejects an unknown action", async () => {
    const res = await PATCH(
      request("http://localhost/api/admin/disputes/d-1", {
        method: "PATCH",
        body: JSON.stringify({ action: "delete" }),
      }),
      params
    );
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("validation");
    expect(adminDb.current!.calls).toHaveLength(0);
  });

  test("PATCH resolves a dispute and records the admin as resolver", async () => {
    adminDb.current!.enqueue("coaching_disputes", { data: [{ id: "d-1" }] });

    const res = await PATCH(
      request("http://localhost/api/admin/disputes/d-1", {
        method: "PATCH",
        body: JSON.stringify({ action: "resolve", adminNotes: "refunded" }),
      }),
      params
    );
    expect(res.status).toBe(200);
    const [updates] = adminDb.current!.callsFor("coaching_disputes", "update")[0] as [
      Record<string, unknown>,
    ];
    expect(updates).toMatchObject({
      status: "resolved",
      resolved_by: "admin-1",
      admin_notes: "refunded",
    });
  });

  test("PATCH returns 404 when the dispute does not exist", async () => {
    adminDb.current!.enqueue("coaching_disputes", { data: [] });
    const res = await PATCH(
      request("http://localhost/api/admin/disputes/d-1", {
        method: "PATCH",
        body: JSON.stringify({ action: "dismiss" }),
      }),
      params
    );
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Dispute not found", code: "not_found" });
  });
});
