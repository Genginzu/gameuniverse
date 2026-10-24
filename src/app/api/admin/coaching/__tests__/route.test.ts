import { describe, test, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";
import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";

const { adminDb, sessionFrom } = vi.hoisted(() => ({
  adminDb: { current: null as ReturnType<typeof createSupabaseQueryMock> | null },
  sessionFrom: vi.fn(),
}));

const routeEnv = useTestRouteEnvironment({ signedInAs: "admin" });

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({
    from: sessionFrom,
  })),
}));

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => adminDb.current!.client,
}));

vi.mock("@/lib/services/userEmailsServerService", () => ({
  fetchUserEmails: vi.fn(async () => new Map([["coach-1", "coach@test.com"]])),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { GET } = await import("@/app/api/admin/coaching/route");
const { PATCH } = await import("@/app/api/admin/coaching/[id]/route");

const SELF_PROMOTED = testUser("user", { user_metadata: { role: "admin" } });

function listRequest(query = "") {
  return new NextRequest(`http://localhost/api/admin/coaching${query}`);
}

function patchRequest(body: object) {
  return new NextRequest("http://localhost/api/admin/coaching/cp-1", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

const params = { params: Promise.resolve({ id: "cp-1" }) };

const coachRow = {
  id: "cp-1",
  player_id: "coach-1",
  bio: "bio",
  is_active: false,
  is_verified: false,
  is_suspended: true,
  average_rating: 4.5,
  total_reviews: 2,
  total_sessions: 3,
  stripe_onboarding_complete: true,
  created_at: "2026-01-01T00:00:00Z",
  profiles: { username: "coach", avatar_url: null },
};

describe("/api/admin/coaching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminDb.current = createSupabaseQueryMock();
  });

  test("GET returns 401 when signed out", async () => {
    routeEnv.signOut();
    const res = await GET(listRequest());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Authentication required", code: "unauthorized" });
  });

  test("GET returns 403 for a user who set role=admin in their own user_metadata", async () => {
    routeEnv.signIn(SELF_PROMOTED);
    const res = await GET(listRequest());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Admin access required", code: "forbidden" });
    expect(adminDb.current!.calls).toHaveLength(0);
  });

  test("GET lists every coach, including suspended ones, through the service-role client", async () => {
    adminDb.current!.enqueue("coach_profiles", { data: [coachRow], count: 1 });

    const res = await GET(listRequest("?status=suspended"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.coaches[0]).toMatchObject({
      id: "cp-1",
      isSuspended: true,
      email: "coach@test.com",
    });
    expect(adminDb.current!.callsFor("coach_profiles", "eq")).toContainEqual([
      "is_suspended",
      true,
    ]);
    expect(sessionFrom).not.toHaveBeenCalled();
  });

  test("PATCH returns 403 for a self-promoted user and writes nothing", async () => {
    routeEnv.signIn(SELF_PROMOTED);
    expect((await PATCH(patchRequest({ action: "verify" }), params)).status).toBe(403);
    expect(adminDb.current!.calls).toHaveLength(0);
  });

  test("PATCH verifies a coach through the service-role client", async () => {
    adminDb.current!.enqueue("coach_profiles", { data: [{ id: "cp-1" }] });

    const res = await PATCH(patchRequest({ action: "verify" }), params);
    expect(res.status).toBe(200);
    const [updates] = adminDb.current!.callsFor("coach_profiles", "update")[0] as [
      Record<string, unknown>,
    ];
    expect(updates.is_verified).toBe(true);
    expect(adminDb.current!.callsFor("coach_profiles", "eq")).toContainEqual(["id", "cp-1"]);
  });

  test("PATCH returns 404 when the coach does not exist", async () => {
    adminDb.current!.enqueue("coach_profiles", { data: [] });
    const res = await PATCH(patchRequest({ action: "suspend" }), params);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Coach not found", code: "not_found" });
  });

  test("PATCH rejects an unknown action", async () => {
    const res = await PATCH(patchRequest({ action: "delete" }), params);
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "Invalid action", code: "validation" });
  });
});
