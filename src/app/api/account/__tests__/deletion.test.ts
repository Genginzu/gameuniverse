import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";

const { mockGetUser, mockSignIn, mockSignOut, adminDb, mockSendEmail } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockSignIn: vi.fn(),
  mockSignOut: vi.fn(),
  adminDb: { current: null as ReturnType<typeof createSupabaseQueryMock> | null },
  mockSendEmail: vi.fn(),
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));
vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: () => adminDb.current!.client }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { signInWithPassword: mockSignIn, signOut: mockSignOut } }),
}));
vi.mock("@/lib/services/rateLimitService", () => ({ enforceRateLimit: vi.fn(async () => null) }));
vi.mock("@/lib/email", () => ({ sendEmail: mockSendEmail }));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { GET, POST, DELETE } = await import("@/app/api/account/deletion/route");

const USER = {
  id: "user-1",
  email: "player@example.com",
  app_metadata: { provider: "email", providers: ["email"] },
  identities: [{ provider: "email" }],
};

function signIn(user: object | null) {
  mockGetUser.mockResolvedValue({ data: { user }, error: null });
}

function postRequest(body: object) {
  return new NextRequest("http://localhost/api/account/deletion", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function queueNoBlocker() {
  adminDb.current!.enqueue("coach_profiles", { data: [] });
  adminDb.current!.enqueue("coaching_sessions", { count: 0 });
  adminDb.current!.enqueue("coaching_disputes", { count: 0 });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://supabase.test";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  adminDb.current = createSupabaseQueryMock();
  mockSignIn.mockResolvedValue({ data: { session: { access_token: "t" } }, error: null });
  mockSignOut.mockResolvedValue({ error: null });
  mockSendEmail.mockResolvedValue({ sent: true });
  signIn(USER);
});

describe("GET /api/account/deletion", () => {
  it("rejects guests", async () => {
    signIn(null);
    expect((await GET()).status).toBe(401);
  });

  it("returns the pending deletion of the signed-in user", async () => {
    adminDb.current!.enqueue("profiles", {
      data: {
        deletion_requested_at: "2026-10-20T10:00:00.000Z",
        deletion_scheduled_for: "2026-11-19T10:00:00.000Z",
      },
    });
    const body = await (await GET()).json();
    expect(body).toEqual({
      pending: true,
      requestedAt: "2026-10-20T10:00:00.000Z",
      scheduledFor: "2026-11-19T10:00:00.000Z",
    });
  });
});

describe("POST /api/account/deletion (request)", () => {
  it("requires the localized confirmation word", async () => {
    const res = await POST(postRequest({ password: "pw", confirmation: "DELETE", locale: "fr" }));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("invalidConfirmation");
    expect(adminDb.current!.callsFor("profiles", "update")).toHaveLength(0);
  });

  it("requires re-authentication with the password", async () => {
    const res = await POST(postRequest({ confirmation: "SUPPRIMER", locale: "fr" }));
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("reauthRequired");
  });

  it("rejects a wrong password", async () => {
    mockSignIn.mockResolvedValue({ data: { session: null }, error: { message: "Invalid" } });
    const res = await POST(
      postRequest({ password: "bad", confirmation: "SUPPRIMER", locale: "fr" })
    );
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("invalidPassword");
    expect(mockSignIn).toHaveBeenCalledWith({ email: USER.email, password: "bad" });
  });

  it("refuses while a coaching payment is held", async () => {
    adminDb.current!.enqueue("coach_profiles", { data: [{ id: "coach-1" }] });
    adminDb.current!.enqueue("coaching_sessions", { count: 1 });
    const res = await POST(
      postRequest({ password: "pw", confirmation: "SUPPRIMER", locale: "fr" })
    );
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("coachingPaymentPending");
    expect(adminDb.current!.callsFor("coaching_sessions", "or")[0]).toEqual([
      "student_id.eq.user-1,coach_id.eq.coach-1",
    ]);
  });

  it("deactivates the account for 30 days and emails a confirmation", async () => {
    queueNoBlocker();
    adminDb.current!.enqueue("profiles", {
      data: {
        deletion_requested_at: "2026-10-20T10:00:00.000Z",
        deletion_scheduled_for: "2026-11-19T10:00:00.000Z",
      },
    });

    const res = await POST(postRequest({ password: "pw", confirmation: "delete", locale: "en" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.pending).toBe(true);
    const [update] = adminDb.current!.callsFor("profiles", "update")[0] as [
      { deletion_requested_at: string; deletion_scheduled_for: string },
    ];
    const graceMs =
      new Date(update.deletion_scheduled_for).getTime() -
      new Date(update.deletion_requested_at).getTime();
    expect(graceMs).toBe(30 * 86_400_000);
    expect(adminDb.current!.callsFor("profiles", "is")[0]).toEqual(["deletion_requested_at", null]);
    expect(mockSignOut).toHaveBeenCalledWith({ scope: "local" });
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: USER.email, subject: "Your account deletion request" })
    );
  });

  it("does not schedule a second deletion", async () => {
    queueNoBlocker();
    adminDb.current!.enqueue("profiles", { data: null });
    const res = await POST(
      postRequest({ password: "pw", confirmation: "SUPPRIMER", locale: "fr" })
    );
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("alreadyPending");
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/account/deletion (cancel)", () => {
  it("restores the account by clearing the deletion state", async () => {
    adminDb.current!.enqueue("profiles", { data: { id: USER.id } });
    adminDb.current!.enqueue("profiles", {
      data: { deletion_requested_at: null, deletion_scheduled_for: null },
    });

    const res = await DELETE();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ pending: false, requestedAt: null, scheduledFor: null });
    expect(adminDb.current!.callsFor("profiles", "update")[0]).toEqual([
      { deletion_requested_at: null, deletion_scheduled_for: null },
    ]);
  });

  it("returns 404 when no deletion is pending", async () => {
    adminDb.current!.enqueue("profiles", { data: null });
    expect((await DELETE()).status).toBe(404);
  });
});
