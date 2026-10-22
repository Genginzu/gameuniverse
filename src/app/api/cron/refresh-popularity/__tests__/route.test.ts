import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: () => ({}) }));
vi.mock("@/lib/services/popularityRefreshService", () => ({ refreshPopularity: vi.fn() }));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from "@/app/api/cron/refresh-popularity/route";
import { refreshPopularity } from "@/lib/services/popularityRefreshService";

function request(secret?: string) {
  return new NextRequest("http://localhost/api/cron/refresh-popularity", {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "cron-secret";
});

describe("cron refresh-popularity", () => {
  it("rejects requests without the cron secret", async () => {
    expect((await GET(request("wrong"))).status).toBe(401);
    expect(refreshPopularity).not.toHaveBeenCalled();
  });

  it("returns the refresh report", async () => {
    const report = { topGames: 3, refreshed: 2, imported: 1, importFailures: 0, rescored: 7 };
    vi.mocked(refreshPopularity).mockResolvedValue(report);

    const response = await GET(request("cron-secret"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(report);
  });

  it("returns 500 when the refresh fails", async () => {
    vi.mocked(refreshPopularity).mockRejectedValue(new Error("igdb down"));
    expect((await GET(request("cron-secret"))).status).toBe(500);
  });
});
