import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockIn } = vi.hoisted(() => ({ mockIn: vi.fn() }));
const mockSelect = vi.fn(() => ({ in: mockIn }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));
const mockSchema = vi.fn(() => ({ from: mockFrom }));

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({ schema: mockSchema }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { fetchUserEmails, fetchUserEmail } from "@/lib/services/userEmailsServerService";

describe("userEmailsServerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads emails from the auth schema, not public.profiles", async () => {
    mockIn.mockResolvedValue({
      data: [
        { id: "u1", email: "a@test.com" },
        { id: "u2", email: "b@test.com" },
      ],
      error: null,
    });

    const map = await fetchUserEmails(["u1", "u2"]);

    expect(mockSchema).toHaveBeenCalledWith("auth");
    expect(mockFrom).toHaveBeenCalledWith("users");
    expect(mockSelect).toHaveBeenCalledWith("id, email");
    expect(map.get("u1")).toBe("a@test.com");
    expect(map.get("u2")).toBe("b@test.com");
  });

  it("dedupes and skips empty ids, and returns empty when none are valid", async () => {
    const map = await fetchUserEmails(["", ""]);
    expect(map.size).toBe(0);
    expect(mockIn).not.toHaveBeenCalled();
  });

  it("queries unique ids only", async () => {
    mockIn.mockResolvedValue({ data: [{ id: "u1", email: "a@test.com" }], error: null });
    await fetchUserEmails(["u1", "u1", "u1"]);
    expect(mockIn).toHaveBeenCalledWith("id", ["u1"]);
  });

  it("returns an empty map and swallows the error when the query fails", async () => {
    mockIn.mockResolvedValue({ data: null, error: { message: "boom" } });
    const map = await fetchUserEmails(["u1"]);
    expect(map.size).toBe(0);
  });

  it("fetchUserEmail resolves a single id", async () => {
    mockIn.mockResolvedValue({ data: [{ id: "u1", email: "a@test.com" }], error: null });
    expect(await fetchUserEmail("u1")).toBe("a@test.com");
  });

  it("fetchUserEmail returns null for a missing id", async () => {
    mockIn.mockResolvedValue({ data: [], error: null });
    expect(await fetchUserEmail("ghost")).toBeNull();
  });

  it("fetchUserEmail returns null for an empty id without querying", async () => {
    expect(await fetchUserEmail("")).toBeNull();
    expect(mockIn).not.toHaveBeenCalled();
  });
});
