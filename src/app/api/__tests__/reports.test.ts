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

const mockGetUser = vi.fn();
const mockProfileRole = vi.fn();

// from("profiles").select("role").eq("id", ...).single()
function profileChain() {
  const proxy: Record<string, unknown> = {};
  proxy.select = () => proxy;
  proxy.eq = () => proxy;
  proxy.single = () => Promise.resolve(mockProfileRole());
  return proxy;
}

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: () => profileChain(),
  })),
}));

import { POST } from "@/app/api/reports/route";
import { GET as ADMIN_GET } from "@/app/api/admin/reports/route";
import { PATCH as ADMIN_PATCH } from "@/app/api/admin/reports/[id]/route";
import { ReportServerService } from "@/lib/services/reportServerService";

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
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockProfileRole.mockReturnValue({ data: { role: "user" }, error: null });
    const req = new NextRequest("http://localhost/api/admin/reports?status=pending");
    const res = await ADMIN_GET(req);
    expect(res.status).toBe(403);
  });

  test("200 with reports for an admin", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin1" } }, error: null });
    mockProfileRole.mockReturnValue({ data: { role: "admin" }, error: null });
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
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockProfileRole.mockReturnValue({ data: { role: "user" }, error: null });
    const res = await ADMIN_PATCH(patchReq({ decision: "resolve" }), {
      params: Promise.resolve({ id: "r1" }),
    });
    expect(res.status).toBe(403);
  });

  test("400 on invalid decision", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin1" } }, error: null });
    mockProfileRole.mockReturnValue({ data: { role: "admin" }, error: null });
    const res = await ADMIN_PATCH(patchReq({ decision: "bogus" }), {
      params: Promise.resolve({ id: "r1" }),
    });
    expect(res.status).toBe(400);
  });

  test("200 on successful resolve", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin1" } }, error: null });
    mockProfileRole.mockReturnValue({ data: { role: "admin" }, error: null });
    vi.mocked(ReportServerService.updateReport).mockResolvedValue(true);
    const res = await ADMIN_PATCH(patchReq({ decision: "resolve", actionTaken: "content_deleted" }), {
      params: Promise.resolve({ id: "r1" }),
    });
    expect(res.status).toBe(200);
    expect(ReportServerService.updateReport).toHaveBeenCalledWith(
      "r1",
      "resolved",
      "content_deleted",
      "admin1"
    );
  });
});
