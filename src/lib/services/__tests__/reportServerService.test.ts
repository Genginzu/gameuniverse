import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const notificationCreate = vi.fn(async () => null);
vi.mock("@/lib/services/notificationServerService", () => ({
  NotificationServerService: { create: (...args: unknown[]) => notificationCreate(...args) },
}));

// Queue of results consumed in order by terminal calls (.single() or awaiting the chain).
let resultQueue: Array<{ data?: unknown; error?: unknown; count?: number }> = [];
const fromCalls: string[] = [];

function nextResult() {
  return resultQueue.shift() ?? { data: null, error: null };
}

function buildChain() {
  const proxy: Record<string, unknown> = {};
  for (const m of ["select", "insert", "update", "delete", "eq", "gte", "order"]) {
    proxy[m] = () => proxy;
  }
  proxy.single = () => Promise.resolve(nextResult());
  proxy.then = (onFulfilled: (v: unknown) => unknown) =>
    Promise.resolve(nextResult()).then(onFulfilled);
  return proxy;
}

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      fromCalls.push(table);
      return buildChain();
    },
  }),
}));

import { ReportServerService } from "@/lib/services/reportServerService";
import { MAX_REPORTS_PER_DAY } from "@/types/report";

beforeEach(() => {
  resultQueue = [];
  fromCalls.length = 0;
  notificationCreate.mockClear();
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
  });
});

describe("ReportServerService.updateReport", () => {
  it("dismisses without applying an action", async () => {
    resultQueue = [
      // getReport().single()
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
      // final update().eq()
      { error: null },
    ];
    const ok = await ReportServerService.updateReport("r1", "dismissed", "none", "admin1");
    expect(ok).toBe(true);
  });

  it("deletes content when resolving with content_deleted", async () => {
    resultQueue = [
      // getReport().single()
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
      // applyAction: delete().eq()
      { error: null },
      // final update().eq()
      { error: null },
    ];
    const ok = await ReportServerService.updateReport(
      "r1",
      "resolved",
      "content_deleted",
      "admin1"
    );
    expect(ok).toBe(true);
    expect(fromCalls).toContain("game_reviews");
  });

  it("warns the author via a notification when resolving with author_warned", async () => {
    resultQueue = [
      // getReport().single()
      {
        data: {
          id: "r1",
          reporter_id: "u1",
          content_type: "post",
          content_id: "p1",
          reason: "harassment",
          description: null,
          status: "pending",
          resolved_by: null,
          resolved_at: null,
          action_taken: null,
          created_at: "2026-09-19T00:00:00Z",
        },
        error: null,
      },
      // resolveAuthorId: select().eq().single()
      { data: { player_id: "author1" }, error: null },
      // final update().eq()
      { error: null },
    ];
    const ok = await ReportServerService.updateReport("r1", "resolved", "author_warned", "admin1");
    expect(ok).toBe(true);
    expect(notificationCreate).toHaveBeenCalledWith(
      "author1",
      "admin1",
      "moderation_warning",
      "p1",
      ""
    );
  });
});
