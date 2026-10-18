import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

let resultQueue: Array<{ data?: unknown; error?: unknown }> = [];
const ops: string[] = [];

function nextResult() {
  return resultQueue.shift() ?? { data: null, error: null };
}

function buildChain() {
  const proxy: Record<string, unknown> = {};
  for (const m of ["select", "eq"]) proxy[m] = () => proxy;
  proxy.delete = () => {
    ops.push("delete");
    return proxy;
  };
  proxy.maybeSingle = () => Promise.resolve(nextResult());
  proxy.then = (onFulfilled: (v: unknown) => unknown) =>
    Promise.resolve(nextResult()).then(onFulfilled);
  return proxy;
}

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({ from: () => buildChain() }),
}));

import { ReportUserServerService } from "@/lib/services/reportUserServerService";

beforeEach(() => {
  resultQueue = [];
  ops.length = 0;
});

describe("ReportUserServerService.listMine", () => {
  it("maps rows and flags open reports as cancellable", async () => {
    resultQueue = [
      {
        data: [
          { id: "r1", content_type: "post", content_id: "p1", status: "pending" },
          { id: "r2", content_type: "review", content_id: "v1", status: "resolved" },
        ],
        error: null,
      },
    ];
    const reports = await ReportUserServerService.listMine("u1");
    expect(reports).toEqual([
      { id: "r1", contentType: "post", contentId: "p1", status: "pending", cancellable: true },
      { id: "r2", contentType: "review", contentId: "v1", status: "resolved", cancellable: false },
    ]);
  });

  it("returns an empty list on error", async () => {
    resultQueue = [{ data: null, error: { message: "boom" } }];
    expect(await ReportUserServerService.listMine("u1")).toEqual([]);
  });
});

describe("ReportUserServerService.cancel", () => {
  it("returns not_found when the report does not belong to the user", async () => {
    resultQueue = [{ data: null, error: null }];
    expect(await ReportUserServerService.cancel("r1", "u1")).toBe("not_found");
    expect(ops).not.toContain("delete");
  });

  it("returns closed when the report was already handled", async () => {
    resultQueue = [{ data: { id: "r1", status: "dismissed" }, error: null }];
    expect(await ReportUserServerService.cancel("r1", "u1")).toBe("closed");
    expect(ops).not.toContain("delete");
  });

  it("deletes an open report", async () => {
    resultQueue = [{ data: { id: "r1", status: "pending" }, error: null }, { error: null }];
    expect(await ReportUserServerService.cancel("r1", "u1")).toBe("ok");
    expect(ops).toContain("delete");
  });
});
