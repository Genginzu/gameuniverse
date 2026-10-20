import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock("@/lib/services/esport/playerTeamHistory", () => ({
  reconcilePlayerTeamHistory: vi.fn(),
}));
vi.mock("@/lib/services/esportPredictionService", () => ({
  resolvePredictionsForMatch: vi.fn(),
}));

import { POST as reconcileHistory } from "@/app/api/internal/esport/reconcile-history/route";
import { POST as resolvePredictions } from "@/app/api/internal/esport/resolve-predictions/route";
import { reconcilePlayerTeamHistory } from "@/lib/services/esport/playerTeamHistory";
import { resolvePredictionsForMatch } from "@/lib/services/esportPredictionService";

function request(path: string, body: unknown, secret?: string) {
  return new NextRequest(`http://localhost/api/internal/esport/${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(secret ? { "x-edge-callback-secret": secret } : {}),
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.EDGE_CALLBACK_SECRET = "edge-secret";
});

afterEach(() => {
  delete process.env.EDGE_CALLBACK_SECRET;
});

describe("POST /api/internal/esport/reconcile-history", () => {
  const body = { inputs: [{ playerLocalId: "p1", newTeamLocalId: "t1" }] };

  it("returns 401 without a valid callback secret", async () => {
    expect((await reconcileHistory(request("reconcile-history", body))).status).toBe(401);
    expect((await reconcileHistory(request("reconcile-history", body, "wrong"))).status).toBe(401);
    expect(reconcilePlayerTeamHistory).not.toHaveBeenCalled();
  });

  it("returns 500 when the callback secret is not configured", async () => {
    delete process.env.EDGE_CALLBACK_SECRET;
    expect((await reconcileHistory(request("reconcile-history", body, "edge-secret"))).status).toBe(500);
  });

  it("reconciles when the secret matches", async () => {
    vi.mocked(reconcilePlayerTeamHistory).mockResolvedValue({ opened: 1, closed: 0, errors: 0 } as never);
    const res = await reconcileHistory(request("reconcile-history", body, "edge-secret"));
    expect(res.status).toBe(200);
    expect(reconcilePlayerTeamHistory).toHaveBeenCalledWith(body.inputs);
  });
});

describe("POST /api/internal/esport/resolve-predictions", () => {
  const body = { matchPandaId: 1, winnerPandaId: 2 };

  it("returns 401 without a valid callback secret", async () => {
    expect((await resolvePredictions(request("resolve-predictions", body))).status).toBe(401);
    expect((await resolvePredictions(request("resolve-predictions", body, "wrong"))).status).toBe(401);
    expect(resolvePredictionsForMatch).not.toHaveBeenCalled();
  });

  it("resolves when the secret matches", async () => {
    vi.mocked(resolvePredictionsForMatch).mockResolvedValue(3 as never);
    const res = await resolvePredictions(request("resolve-predictions", body, "edge-secret"));
    expect(res.status).toBe(200);
    expect(resolvePredictionsForMatch).toHaveBeenCalledWith(1, 2);
  });
});
