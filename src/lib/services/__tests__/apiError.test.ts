import { describe, it, expect, vi, beforeEach } from "vitest";

const mutate = vi.fn();
vi.mock("swr", () => ({ mutate: (...args: unknown[]) => mutate(...args) }));

import { createApiError, isSuspendedError, MY_SUSPENSION_KEY } from "@/lib/services/apiError";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => mutate.mockReset());

describe("createApiError", () => {
  it("keeps the server message, status and code", async () => {
    const err = await createApiError(json(409, { error: "Already", code: "duplicate" }), "x");
    expect(err.message).toBe("Already");
    expect(err.status).toBe(409);
    expect(err.code).toBe("duplicate");
    expect(mutate).not.toHaveBeenCalled();
  });

  it("falls back when the body is not JSON", async () => {
    const err = await createApiError(new Response("oops", { status: 500 }), "Fallback");
    expect(err.message).toBe("Fallback");
    expect(err.code).toBeUndefined();
  });

  it("flags suspensions and refreshes the suspension status", async () => {
    const until = "2026-10-25T11:49:00.000Z";
    const err = await createApiError(
      json(403, { error: "Account suspended", code: "suspended", suspendedUntil: until }),
      "x"
    );
    expect(isSuspendedError(err)).toBe(true);
    expect(err.suspendedUntil).toBe(until);
    expect(mutate).toHaveBeenCalledWith(MY_SUSPENSION_KEY);
  });
});

describe("isSuspendedError", () => {
  it("is false for other errors and non-errors", () => {
    expect(isSuspendedError(new Error("boom"))).toBe(false);
    expect(isSuspendedError(null)).toBe(false);
    expect(isSuspendedError(undefined)).toBe(false);
  });
});
