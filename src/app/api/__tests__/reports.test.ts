import { describe, test, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/services/reportServerService", () => ({
  ReportServerService: {
    createReport: vi.fn(),
    listReports: vi.fn(),
    updateReport: vi.fn(),
  },
}));

vi.mock("@/lib/services/reportUserServerService", () => ({
  ReportUserServerService: {
    listMine: vi.fn(),
    cancel: vi.fn(),
  },
}));

const mockGetUser = vi.fn();

// Admin rights come from the session (email domain / metadata), see @/lib/auth-admin.
const ADMIN = { id: "admin1", email: "boss@admin.gamesuniverse.com", user_metadata: {} };
const NON_ADMIN = { id: "u1", email: "player@example.com", user_metadata: {} };

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

import { POST, GET as USER_GET } from "@/app/api/reports/route";
import { DELETE as USER_DELETE } from "@/app/api/reports/[id]/route";
import { GET as ADMIN_GET } from "@/app/api/admin/reports/route";
import { PATCH as ADMIN_PATCH } from "@/app/api/admin/reports/[id]/route";
import { ReportServerService } from "@/lib/services/reportServerService";
import { ReportUserServerService } from "@/lib/services/reportUserServerService";

function postReq(body: unknown) {
  return new NextRequest("http://localhost/api/reports", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/reports", () => {
  test("401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(postReq({ contentType: "review", contentId: "c1", reason: "spam" }));
    expect(res.status).toBe(401);
  });

  test("400 on invalid contentType", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const res = await POST(postReq({ contentType: "bogus", contentId: "c1", reason: "spam" }));
    expect(res.status).toBe(400);
  });

  test("400 on invalid reason", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const res = await POST(postReq({ contentType: "review", contentId: "c1", reason: "bad" }));
    expect(res.status).toBe(400);
  });

  test("429 when daily limit reached", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    vi.mocked(ReportServerService.createReport).mockResolvedValue({ ok: false, code: "limit" });
    const res = await POST(postReq({ contentType: "review", contentId: "c1", reason: "spam" }));
    expect(res.status).toBe(429);
  });

  test("409 on duplicate report", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    vi.mocked(ReportServerService.createReport).mockResolvedValue({ ok: false, code: "duplicate" });
    const res = await POST(postReq({ contentType: "review", contentId: "c1", reason: "spam" }));
    expect(res.status).toBe(409);
  });

  test("201 with created report on success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const report = { id: "r1" } as never;
    vi.mocked(ReportServerService.createReport).mockResolvedValue({ ok: true, report });
    const res = await POST(postReq({ contentType: "review", contentId: "c1", reason: "spam" }));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ report: { id: "r1" } });
  });
});

describe("GET /api/admin/reports", () => {
  test("403 when not an admin", async () => {
    mockGetUser.mockResolvedValue({ data: { user: NON_ADMIN }, error: null });
    const req = new NextRequest("http://localhost/api/admin/reports?status=pending");
    const res = await ADMIN_GET(req);
    expect(res.status).toBe(403);
  });

  test("200 with reports for an admin", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN }, error: null });
    vi.mocked(ReportServerService.listReports).mockResolvedValue([{ id: "r1" }] as never);
    const req = new NextRequest("http://localhost/api/admin/reports?status=pending");
    const res = await ADMIN_GET(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ reports: [{ id: "r1" }] });
  });
});

describe("PATCH /api/admin/reports/[id]", () => {
  function patchReq(body: unknown) {
    return new NextRequest("http://localhost/api/admin/reports/r1", {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }

  test("403 when not an admin", async () => {
    mockGetUser.mockResolvedValue({ data: { user: NON_ADMIN }, error: null });
    const res = await ADMIN_PATCH(patchReq({ decision: "resolve" }), {
      params: Promise.resolve({ id: "r1" }),
    });
    expect(res.status).toBe(403);
  });

  test("400 on invalid decision", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN }, error: null });
    const res = await ADMIN_PATCH(patchReq({ decision: "bogus" }), {
      params: Promise.resolve({ id: "r1" }),
    });
    expect(res.status).toBe(400);
  });

  test("200 on successful resolve", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN }, error: null });
    vi.mocked(ReportServerService.updateReport).mockResolvedValue("ok");
    const res = await ADMIN_PATCH(
      patchReq({ decision: "resolve", actionTaken: "content_deleted" }),
      {
        params: Promise.resolve({ id: "r1" }),
      }
    );
    expect(res.status).toBe(200);
    expect(ReportServerService.updateReport).toHaveBeenCalledWith(
      "r1",
      "resolved",
      "content_deleted",
      "admin1",
      { suspensionDays: 7 }
    );
  });

  test("suspension defaults to 7 days when no duration is sent", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN }, error: null });
    vi.mocked(ReportServerService.updateReport).mockResolvedValue("ok");
    await ADMIN_PATCH(patchReq({ decision: "resolve", actionTaken: "author_suspended" }), {
      params: Promise.resolve({ id: "r1" }),
    });
    expect(ReportServerService.updateReport).toHaveBeenCalledWith(
      "r1",
      "resolved",
      "author_suspended",
      "admin1",
      { suspensionDays: 7 }
    );
  });

  test.each([0, 366, 2.5, "10", -3])("400 when suspensionDays is %s", async (days) => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN }, error: null });
    const res = await ADMIN_PATCH(
      patchReq({ decision: "resolve", actionTaken: "author_suspended", suspensionDays: days }),
      { params: Promise.resolve({ id: "r1" }) }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("invalid_days");
    expect(ReportServerService.updateReport).not.toHaveBeenCalled();
  });

  test.each([1, 365])("accepts the %s-day boundary", async (days) => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN }, error: null });
    vi.mocked(ReportServerService.updateReport).mockResolvedValue("ok");
    const res = await ADMIN_PATCH(
      patchReq({ decision: "resolve", actionTaken: "author_suspended", suspensionDays: days }),
      { params: Promise.resolve({ id: "r1" }) }
    );
    expect(res.status).toBe(200);
  });

  test("404 when the report does not exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN }, error: null });
    vi.mocked(ReportServerService.updateReport).mockResolvedValue("not_found");
    const res = await ADMIN_PATCH(patchReq({ decision: "dismiss" }), {
      params: Promise.resolve({ id: "r1" }),
    });
    expect(res.status).toBe(404);
  });

  test("409 when the report was already handled", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN }, error: null });
    vi.mocked(ReportServerService.updateReport).mockResolvedValue("closed");
    const res = await ADMIN_PATCH(patchReq({ decision: "dismiss" }), {
      params: Promise.resolve({ id: "r1" }),
    });
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("closed");
  });
});

describe("GET /api/reports", () => {
  test("401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await USER_GET();
    expect(res.status).toBe(401);
  });

  test("200 with the current user's reports", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const reports = [
      { id: "r1", contentType: "post", contentId: "p1", status: "pending", cancellable: true },
    ];
    vi.mocked(ReportUserServerService.listMine).mockResolvedValue(reports as never);
    const res = await USER_GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ reports });
    expect(ReportUserServerService.listMine).toHaveBeenCalledWith("u1");
  });
});

describe("DELETE /api/reports/[id]", () => {
  const req = () => new NextRequest("http://localhost/api/reports/r1", { method: "DELETE" });
  const ctx = { params: Promise.resolve({ id: "r1" }) };

  test("401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await USER_DELETE(req(), ctx);
    expect(res.status).toBe(401);
  });

  test("404 when the report is not owned by the user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    vi.mocked(ReportUserServerService.cancel).mockResolvedValue("not_found");
    const res = await USER_DELETE(req(), { params: Promise.resolve({ id: "r1" }) });
    expect(res.status).toBe(404);
  });

  test("409 when the report was already handled", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    vi.mocked(ReportUserServerService.cancel).mockResolvedValue("closed");
    const res = await USER_DELETE(req(), { params: Promise.resolve({ id: "r1" }) });
    expect(res.status).toBe(409);
  });

  test("200 when the report is cancelled", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    vi.mocked(ReportUserServerService.cancel).mockResolvedValue("ok");
    const res = await USER_DELETE(req(), { params: Promise.resolve({ id: "r1" }) });
    expect(res.status).toBe(200);
    expect(ReportUserServerService.cancel).toHaveBeenCalledWith("r1", "u1");
  });
});
