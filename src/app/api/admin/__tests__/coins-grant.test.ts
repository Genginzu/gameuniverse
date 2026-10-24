import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";

const { mockGrant } = vi.hoisted(() => ({ mockGrant: vi.fn() }));

const routeEnv = useTestRouteEnvironment({ signedInAs: testUser("admin", { id: "admin-1" }) });

vi.mock("@/lib/services/coinService", () => ({ CoinService: { grant: mockGrant } }));

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { POST } from "@/app/api/admin/coins/grant/route";

const PLAYER_ID = "4f9b2c1a-6d3e-4a7b-9c8d-112233445566";
const NONCE = "7f0c1d2e-3a4b-4c5d-8e9f-001122334455";

function grantRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/coins/grant", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const validBody = { playerId: PLAYER_ID, amount: -50, description: "refund", nonce: NONCE };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/admin/coins/grant", () => {
  it("refuses a non-admin", async () => {
    routeEnv.signIn("user");

    const res = await POST(grantRequest(validBody));

    expect(res.status).toBe(403);
    expect(mockGrant).not.toHaveBeenCalled();
  });

  it("answers 401 to a signed-out caller", async () => {
    routeEnv.signOut();

    expect((await POST(grantRequest(validBody))).status).toBe(401);
    expect(mockGrant).not.toHaveBeenCalled();
  });

  it("requires a nonce identifying the grant attempt", async () => {
    const res = await POST(grantRequest({ ...validBody, nonce: undefined }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ code: "invalid_request" });
    expect(mockGrant).not.toHaveBeenCalled();
  });

  it("posts the grant on behalf of the signed-in admin", async () => {
    mockGrant.mockResolvedValue({ posted: true, transaction: { id: "tx-1" } });

    const res = await POST(grantRequest(validBody));

    expect(res.status).toBe(200);
    expect(mockGrant).toHaveBeenCalledWith({ adminId: "admin-1", ...validBody });
  });

  it("treats a replayed nonce as success", async () => {
    mockGrant.mockResolvedValue({ posted: false, reason: "duplicate" });

    const res = await POST(grantRequest(validBody));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ duplicate: true });
  });

  it("reports an overdraft with a translatable code", async () => {
    mockGrant.mockResolvedValue({ posted: false, reason: "insufficient_balance" });

    const res = await POST(grantRequest(validBody));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ code: "insufficient_balance" });
  });
});
