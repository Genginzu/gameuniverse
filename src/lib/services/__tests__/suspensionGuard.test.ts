import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

let profileResult: { data: unknown; error: unknown } = { data: null, error: null };
let throwOnFrom = false;

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({
    from: () => {
      if (throwOnFrom) throw new Error("no service role key");
      const chain: Record<string, unknown> = {};
      chain.select = () => chain;
      chain.eq = () => chain;
      chain.maybeSingle = () => Promise.resolve(profileResult);
      return chain;
    },
  }),
}));

import { getActiveSuspension, suspendedResponse } from "@/lib/services/suspensionGuard";

const inDays = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();

beforeEach(() => {
  profileResult = { data: null, error: null };
  throwOnFrom = false;
});

describe("getActiveSuspension", () => {
  it("returns null for a non-suspended account", async () => {
    profileResult = { data: { is_suspended: false, suspended_until: null }, error: null };
    expect(await getActiveSuspension("u1")).toBeNull();
  });

  it("returns the end date while the suspension is running", async () => {
    const until = inDays(3);
    profileResult = { data: { is_suspended: true, suspended_until: until }, error: null };
    expect(await getActiveSuspension("u1")).toEqual({ until });
  });

  it("ignores an expired suspension", async () => {
    profileResult = { data: { is_suspended: true, suspended_until: inDays(-1) }, error: null };
    expect(await getActiveSuspension("u1")).toBeNull();
  });

  it("fails open when the lookup throws (RLS still enforces)", async () => {
    throwOnFrom = true;
    expect(await getActiveSuspension("u1")).toBeNull();
  });
});

describe("suspendedResponse", () => {
  it("returns a 403 with code 'suspended' for a suspended account", async () => {
    const until = inDays(7);
    profileResult = { data: { is_suspended: true, suspended_until: until }, error: null };
    const res = await suspendedResponse("u1");
    expect(res?.status).toBe(403);
    expect(await res?.json()).toEqual({
      error: "Account suspended",
      code: "suspended",
      suspendedUntil: until,
    });
  });

  it("returns null when the user may write", async () => {
    expect(await suspendedResponse("u1")).toBeNull();
  });
});
