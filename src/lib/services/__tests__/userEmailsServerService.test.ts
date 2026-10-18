import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockGetUserById, mockSchema } = vi.hoisted(() => ({
  mockGetUserById: vi.fn(),
  mockSchema: vi.fn(),
}));

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({
    auth: { admin: { getUserById: mockGetUserById } },
    schema: mockSchema,
  }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { fetchUserEmails, fetchUserEmail } from "@/lib/services/userEmailsServerService";

const EMAILS: Record<string, string | null> = {
  u1: "a@test.com",
  u2: "b@test.com",
  noEmail: null,
};

function resolveFromFixture(userId: string) {
  if (userId in EMAILS) {
    return Promise.resolve({ data: { user: { id: userId, email: EMAILS[userId] } }, error: null });
  }
  return Promise.resolve({ data: { user: null }, error: { message: "User not found" } });
}

describe("userEmailsServerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserById.mockImplementation(resolveFromFixture);
  });

  it("reads emails through the auth admin API, never through PostgREST", async () => {
    const map = await fetchUserEmails(["u1", "u2"]);

    expect(mockGetUserById).toHaveBeenCalledWith("u1");
    expect(mockGetUserById).toHaveBeenCalledWith("u2");
    expect(mockSchema).not.toHaveBeenCalled();
    expect(map.get("u1")).toBe("a@test.com");
    expect(map.get("u2")).toBe("b@test.com");
  });

  it("returns an empty map without calling the API when no id is valid", async () => {
    const map = await fetchUserEmails(["", ""]);
    expect(map.size).toBe(0);
    expect(mockGetUserById).not.toHaveBeenCalled();
  });

  it("looks up each unique id once", async () => {
    await fetchUserEmails(["u1", "u1", "u1"]);
    expect(mockGetUserById).toHaveBeenCalledTimes(1);
  });

  it("omits ids whose lookup fails and keeps the others", async () => {
    const map = await fetchUserEmails(["u1", "ghost"]);
    expect(map.get("u1")).toBe("a@test.com");
    expect(map.has("ghost")).toBe(false);
  });

  it("keeps users without an email as null", async () => {
    const map = await fetchUserEmails(["noEmail"]);
    expect(map.has("noEmail")).toBe(true);
    expect(map.get("noEmail")).toBeNull();
  });

  it("never runs more than 10 lookups at the same time", async () => {
    let inFlight = 0;
    let peak = 0;
    mockGetUserById.mockImplementation(async (userId: string) => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight -= 1;
      return { data: { user: { id: userId, email: `${userId}@test.com` } }, error: null };
    });

    const ids = Array.from({ length: 25 }, (_, index) => `user-${index}`);
    const map = await fetchUserEmails(ids);

    expect(map.size).toBe(25);
    expect(peak).toBeLessThanOrEqual(10);
  });

  it("fetchUserEmail resolves a single id", async () => {
    expect(await fetchUserEmail("u1")).toBe("a@test.com");
  });

  it("fetchUserEmail returns null for an unknown id", async () => {
    expect(await fetchUserEmail("ghost")).toBeNull();
  });

  it("fetchUserEmail returns null for an empty id without calling the API", async () => {
    expect(await fetchUserEmail("")).toBeNull();
    expect(mockGetUserById).not.toHaveBeenCalled();
  });
});
