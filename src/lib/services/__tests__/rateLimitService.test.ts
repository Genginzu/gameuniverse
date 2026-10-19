import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRpc = vi.fn();
vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: () => ({ rpc: mockRpc }) }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

import { clientIp, enforceRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/services/rateLimitService";

const req = (headers: Record<string, string>) => new Request("http://localhost/api/x", { headers });

describe("rateLimitService", () => {
  beforeEach(() => mockRpc.mockReset());

  it("keys signed-in callers by user id and anonymous callers by first forwarded IP", () => {
    expect(rateLimitKey("review", { userId: "u1" })).toBe("review:user:u1");
    expect(rateLimitKey("search", { request: req({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }) })).toBe(
      "search:ip:203.0.113.7"
    );
    expect(clientIp(req({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
  });

  it("passes the action limits to consume_rate_limit and lets allowed calls through", async () => {
    mockRpc.mockResolvedValue({ data: { allowed: true, retry_after: 0 }, error: null });
    expect(await enforceRateLimit("review", { userId: "u1" })).toBeNull();
    expect(mockRpc).toHaveBeenCalledWith("consume_rate_limit", {
      p_key: "review:user:u1",
      p_limit: RATE_LIMITS.review.limit,
      p_window_seconds: RATE_LIMITS.review.windowSeconds,
    });
  });

  it("returns 429 with Retry-After when over the limit", async () => {
    mockRpc.mockResolvedValue({ data: { allowed: false, retry_after: 42 }, error: null });
    const res = await enforceRateLimit("comment", { userId: "u1" });
    expect(res?.status).toBe(429);
    expect(res?.headers.get("Retry-After")).toBe("42");
  });

  it("fails open when the database errors", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    expect(await enforceRateLimit("upload", { userId: "u1" })).toBeNull();
  });
});
