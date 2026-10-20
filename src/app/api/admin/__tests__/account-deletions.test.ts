import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";

const { mockGetUser, adminDb } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  adminDb: { current: null as ReturnType<typeof createSupabaseQueryMock> | null },
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
  createServerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));
vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: () => adminDb.current!.client }));
vi.mock("@/lib/services/accountPurgeService", () => ({ purgeAccount: vi.fn() }));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { GET } = await import("@/app/api/admin/account-deletions/route");
const { POST, DELETE } = await import("@/app/api/admin/account-deletions/[id]/route");
const { purgeAccount } = await import("@/lib/services/accountPurgeService");

const ADMIN = { id: "admin-1", app_metadata: { role: "admin" } };
const PLAYER = { id: "player-1", app_metadata: {} };
const TARGET = "0f8fad5b-d9cb-469f-a165-70867728950e";

function signIn(user: object | null) {
  mockGetUser.mockResolvedValue({ data: { user }, error: null });
}

function context(id = TARGET) {
  return { params: Promise.resolve({ id }) };
}

const request = new NextRequest(`http://localhost/api/admin/account-deletions/${TARGET}`);

beforeEach(() => {
  vi.clearAllMocks();
  adminDb.current = createSupabaseQueryMock();
  signIn(ADMIN);
});

describe("admin account deletions", () => {
  it("is reserved to admins", async () => {
    signIn(PLAYER);
    expect((await GET()).status).toBe(403);
    expect((await POST(request, context())).status).toBe(403);
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

    const body = await (await GET()).json();
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
    expect((await POST(request, context())).status).toBe(404);
    expect(purgeAccount).not.toHaveBeenCalled();
  });

  it("rejects malformed ids", async () => {
    expect((await DELETE(request, context("not-a-uuid"))).status).toBe(400);
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
