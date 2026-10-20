import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";

const { adminDb } = vi.hoisted(() => ({
  adminDb: { current: null as ReturnType<typeof createSupabaseQueryMock> | null },
}));

vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: () => adminDb.current!.client }));
vi.mock("@/lib/services/accountPurgeService", () => ({ purgeAccount: vi.fn() }));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from "@/app/api/cron/purge-deleted-accounts/route";
import { purgeAccount } from "@/lib/services/accountPurgeService";

function request(secret?: string) {
  return new NextRequest("http://localhost/api/cron/purge-deleted-accounts", {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "cron-secret";
  adminDb.current = createSupabaseQueryMock();
});

describe("cron purge-deleted-accounts", () => {
  it("rejects requests without the cron secret", async () => {
    expect((await GET(request())).status).toBe(401);
    expect(purgeAccount).not.toHaveBeenCalled();
  });

  it("purges only accounts whose grace period is over", async () => {
    adminDb.current!.enqueue("profiles", { data: [{ id: "u1" }, { id: "u2" }] });
    vi.mocked(purgeAccount)
      .mockResolvedValueOnce({ userId: "u1", ok: true })
      .mockRejectedValueOnce(new Error("boom"));

    const res = await GET(request("cron-secret"));
    const body = await res.json();

    const [column, cutoff] = adminDb.current!.callsFor("profiles", "lte")[0] as [string, string];
    expect(column).toBe("deletion_scheduled_for");
    expect(new Date(cutoff).getTime()).toBeLessThanOrEqual(Date.now());
    expect(adminDb.current!.callsFor("profiles", "not")[0]).toEqual([
      "deletion_requested_at",
      "is",
      null,
    ]);
    expect(purgeAccount).toHaveBeenCalledTimes(2);
    expect(body).toMatchObject({ processed: 2, purged: 1, failed: 1 });
    expect(body.outcomes[1]).toEqual({ userId: "u2", ok: false, error: "boom" });
  });
});
