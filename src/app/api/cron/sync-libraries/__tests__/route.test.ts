import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const query = {
  select: vi.fn(),
  in: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
};
const admin = { from: vi.fn(() => query) };

vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: () => admin }));
vi.mock("@/lib/services/librarySyncJobs", () => ({ createSyncJob: vi.fn() }));
vi.mock("@/lib/services/library-sync", () => ({ runLibrarySyncJob: vi.fn() }));

import { GET } from "@/app/api/cron/sync-libraries/route";
import { createSyncJob } from "@/lib/services/librarySyncJobs";
import { runLibrarySyncJob } from "@/lib/services/library-sync";

function request(secret?: string) {
  return new NextRequest("http://localhost/api/cron/sync-libraries", {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "cron-secret";
  query.select.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockResolvedValue({
    data: [
      { player_id: "u1", platform: "steam" },
      { player_id: "u2", platform: "xbox" },
      { player_id: "u3", platform: "playstation" },
    ],
    error: null,
  });
});

describe("cron sync-libraries", () => {
  it("rejects requests without the cron secret", async () => {
    const res = await GET(request());
    expect(res.status).toBe(401);
  });

  it("selects candidates in id order and runs them through the job system", async () => {
    vi.mocked(createSyncJob).mockImplementation(async (_admin, userId) => ({
      job: { id: `job-${userId}` } as never,
      alreadyRunning: userId === "u2",
    }));
    vi.mocked(runLibrarySyncJob)
      .mockResolvedValueOnce({ status: "succeeded", total: 5, matched: 5 })
      .mockResolvedValueOnce({ status: "failed", total: 0, matched: 0, error: "boom" });

    const res = await GET(request("cron-secret"));
    const body = await res.json();

    expect(query.order).toHaveBeenCalledWith("id", { ascending: true });
    expect(createSyncJob).toHaveBeenCalledTimes(3);
    expect(runLibrarySyncJob).toHaveBeenCalledTimes(2);
    expect(runLibrarySyncJob).toHaveBeenCalledWith({
      admin,
      jobId: "job-u1",
      userId: "u1",
      platform: "steam",
    });
    expect(body).toMatchObject({ processed: 3, succeeded: 1, failed: 1, skipped: 1 });
    expect(body.outcomes[1]).toMatchObject({ playerId: "u2", status: "skipped" });
  });
});
