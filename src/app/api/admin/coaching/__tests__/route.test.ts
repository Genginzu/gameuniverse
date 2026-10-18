import { describe, test, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";

const { mockGetUser, adminDb, sessionFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  adminDb: { current: null as ReturnType<typeof createSupabaseQueryMock> | null },
  sessionFrom: vi.fn(),
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
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

const ADMIN = {
  id: "admin-1",
  email: "boss@example.com",
  app_metadata: { role: "admin" },
  user_metadata: {},
};
const SELF_PROMOTED = {
  id: "u-1",
  email: "p@example.com",
  app_metadata: {},
  user_metadata: { role: "admin" },
};

function signIn(user: object | null) {
  mockGetUser.mockResolvedValue({ data: { user }, error: null });
}

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
    signIn(null);
    expect((await GET(listRequest())).status).toBe(401);
  });

  test("GET returns 403 for a user who set role=admin in their own user_metadata", async () => {
    signIn(SELF_PROMOTED);
    expect((await GET(listRequest())).status).toBe(403);
    expect(adminDb.current!.calls).toHaveLength(0);
  });

  test("GET lists every coach, including suspended ones, through the service-role client", async () => {
    signIn(ADMIN);
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
    signIn(SELF_PROMOTED);
    expect((await PATCH(patchRequest({ action: "verify" }), params)).status).toBe(403);
    expect(adminDb.current!.calls).toHaveLength(0);
  });

  test("PATCH verifies a coach through the service-role client", async () => {
    signIn(ADMIN);
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
    signIn(ADMIN);
    adminDb.current!.enqueue("coach_profiles", { data: [] });
    expect((await PATCH(patchRequest({ action: "suspend" }), params)).status).toBe(404);
  });

  test("PATCH rejects an unknown action", async () => {
    signIn(ADMIN);
    expect((await PATCH(patchRequest({ action: "delete" }), params)).status).toBe(400);
  });
});
