import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const contentAuthorWarned = vi.fn(async () => ({ delivered: 1 }));
vi.mock("@/lib/services/notifications", () => ({
  contentAuthorWarned: (...args: unknown[]) => contentAuthorWarned(...(args as [])),
}));

// Queue of results consumed in order by terminal calls (.single() or awaiting the chain).
let resultQueue: Array<{ data?: unknown; error?: unknown; count?: number }> = [];
const fromCalls: string[] = [];
// Every chained call as [table, method, ...args] to assert filters and payloads.
const calls: Array<[string, string, ...unknown[]]> = [];

function nextResult() {
  return resultQueue.shift() ?? { data: null, error: null };
}

function buildChain(table: string) {
  const proxy: Record<string, unknown> = {};
  for (const m of ["select", "insert", "update", "delete", "eq", "gte", "order", "in"]) {
    proxy[m] = (...args: unknown[]) => {
      calls.push([table, m, ...args]);
      return proxy;
    };
  }
  proxy.single = () => Promise.resolve(nextResult());
  proxy.maybeSingle = () => Promise.resolve(nextResult());
  proxy.then = (onFulfilled: (v: unknown) => unknown) =>
    Promise.resolve(nextResult()).then(onFulfilled);
  return proxy;
}

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      fromCalls.push(table);
      return buildChain(table);
    },
  }),
}));

import { ReportServerService } from "@/lib/services/reportServerService";
import { MAX_REPORTS_PER_DAY } from "@/types/report";

beforeEach(() => {
  resultQueue = [];
  fromCalls.length = 0;
  calls.length = 0;
  contentAuthorWarned.mockClear();
});

describe("ReportServerService.createReport", () => {
  it("rejects with code 'limit' when the daily limit is reached", async () => {
    resultQueue = [{ count: MAX_REPORTS_PER_DAY }];
    const res = await ReportServerService.createReport("u1", {
      contentType: "review",
      contentId: "c1",
      reason: "spam",
    });
    expect(res).toEqual({ ok: false, code: "limit" });
  });

  it("rejects with code 'duplicate' on unique violation", async () => {
    resultQueue = [{ count: 0 }, { data: null, error: { code: "23505" } }];
    const res = await ReportServerService.createReport("u1", {
      contentType: "review",
      contentId: "c1",
      reason: "spam",
    });
    expect(res).toEqual({ ok: false, code: "duplicate" });
  });

  it("returns the created report on success", async () => {
    resultQueue = [
      { count: 0 },
      {
        data: {
          id: "r1",
          reporter_id: "u1",
          content_type: "review",
          content_id: "c1",
          reason: "spam",
          description: null,
          status: "pending",
          resolved_by: null,
          resolved_at: null,
          action_taken: null,
          created_at: "2026-09-19T00:00:00Z",
        },
        error: null,
      },
    ];
    const res = await ReportServerService.createReport("u1", {
      contentType: "review",
      contentId: "c1",
      reason: "spam",
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.report.id).toBe("r1");
      expect(res.report.contentType).toBe("review");
      expect(res.report.status).toBe("pending");
    }
  });
});

describe("ReportServerService.listReports", () => {
  it("maps rows to camelCase reports", async () => {
    resultQueue = [
      {
        data: [
          {
            id: "r1",
            reporter_id: "u1",
            content_type: "post",
            content_id: "p1",
            reason: "harassment",
            description: "bad",
            status: "pending",
            resolved_by: null,
            resolved_at: null,
            action_taken: null,
            created_at: "2026-09-19T00:00:00Z",
            reporter: { username: "alice", avatar_url: null },
          },
        ],
        error: null,
      },
    ];
    const reports = await ReportServerService.listReports("pending");
    expect(reports).toHaveLength(1);
    expect(reports[0].reporter?.username).toBe("alice");
    expect(reports[0].contentType).toBe("post");
    // No player_posts row returned → content treated as deleted.
    expect(reports[0].content?.exists).toBe(false);
  });
});

function reportRow(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      id: "r1",
      reporter_id: "u1",
      content_type: "review",
      content_id: "c1",
      reason: "spam",
      description: null,
      status: "pending",
      resolved_by: null,
      resolved_at: null,
      action_taken: null,
      created_at: "2026-09-19T00:00:00Z",
      ...overrides,
    },
    error: null,
  };
}

const reportUpdates = () => calls.filter(([t, m]) => t === "content_reports" && m === "update");

describe("ReportServerService.updateReport", () => {
  it("returns not_found when the report does not exist", async () => {
    resultQueue = [{ data: null, error: { message: "none" } }];
    expect(await ReportServerService.updateReport("r1", "dismissed", "none", "admin1")).toBe(
      "not_found"
    );
  });

  it("returns closed and applies nothing when the report is already handled", async () => {
    resultQueue = [reportRow({ status: "resolved" })];
    const res = await ReportServerService.updateReport("r1", "resolved", "content_deleted", "a1");
    expect(res).toBe("closed");
    expect(fromCalls).not.toContain("game_reviews");
    expect(reportUpdates()).toHaveLength(0);
  });

  it("dismisses only this report", async () => {
    resultQueue = [reportRow(), { error: null }];
    expect(await ReportServerService.updateReport("r1", "dismissed", "none", "admin1")).toBe("ok");
    expect(calls).toContainEqual(["content_reports", "eq", "id", "r1"]);
    expect(calls).not.toContainEqual(["content_reports", "in", "status", ["pending", "reviewed"]]);
  });

  it("deletes content and closes every open report on the same content", async () => {
    resultQueue = [reportRow(), { error: null }, { error: null }];
    const res = await ReportServerService.updateReport("r1", "resolved", "content_deleted", "a1");
    expect(res).toBe("ok");
    expect(calls).toContainEqual(["game_reviews", "delete"]);
    expect(calls).toContainEqual(["content_reports", "eq", "content_type", "review"]);
    expect(calls).toContainEqual(["content_reports", "eq", "content_id", "c1"]);
    expect(calls).toContainEqual(["content_reports", "in", "status", ["pending", "reviewed"]]);
    const [, , payload] = reportUpdates()[0];
    expect(payload).toMatchObject({ status: "resolved", action_taken: "content_deleted" });
  });

  it("warns the author via a notification", async () => {
    resultQueue = [
      reportRow({ content_type: "post", content_id: "p1" }),
      { data: { player_id: "author1" }, error: null },
      { error: null },
    ];
    const res = await ReportServerService.updateReport("r1", "resolved", "author_warned", "a1");
    expect(res).toBe("ok");
    expect(contentAuthorWarned).toHaveBeenCalledWith({
      authorId: "author1",
      moderatorId: "a1",
      contentType: "post",
      contentId: "p1",
    });
  });

  it("suspends the author for the requested number of days", async () => {
    resultQueue = [
      reportRow({ content_type: "post", content_id: "p1" }),
      { data: { player_id: "author1" }, error: null },
      { error: null },
      { error: null },
    ];
    const before = Date.now();
    const res = await ReportServerService.updateReport("r1", "resolved", "author_suspended", "a1", {
      suspensionDays: 30,
    });
    expect(res).toBe("ok");

    const profileUpdate = calls.find(([t, m]) => t === "profiles" && m === "update");
    const payload = profileUpdate?.[2] as { is_suspended: boolean; suspended_until: string };
    expect(payload.is_suspended).toBe(true);
    const days = (new Date(payload.suspended_until).getTime() - before) / 86_400_000;
    expect(Math.round(days)).toBe(30);
    expect(calls).toContainEqual(["profiles", "eq", "id", "author1"]);
  });

  it("refuses to suspend without a valid duration and keeps the report open", async () => {
    resultQueue = [
      reportRow({ content_type: "post", content_id: "p1" }),
      { data: { player_id: "author1" }, error: null },
    ];
    const res = await ReportServerService.updateReport("r1", "resolved", "author_suspended", "a1", {
      suspensionDays: 0,
    });
    expect(res).toBe("error");
    expect(calls.some(([t, m]) => t === "profiles" && m === "update")).toBe(false);
    expect(reportUpdates()).toHaveLength(0);
  });
});
