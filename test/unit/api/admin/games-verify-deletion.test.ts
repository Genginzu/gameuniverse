import { describe, test, expect, beforeEach, vi } from "vitest";

let mockRequireAdmin: any;
let mockVerifyConsistency: any;

vi.mock("../../../../src/lib/auth-admin", () => ({
  requireAdmin: () => (mockRequireAdmin ? mockRequireAdmin() : Promise.resolve(true)),
}));

vi.mock("../../../../src/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("../../../../src/lib/realtime-updates", () => ({
  verifyGameDeletionConsistency: (...args: any[]) =>
    mockVerifyConsistency ? mockVerifyConsistency(...args) : Promise.resolve({ consistent: true }),
}));

const { POST } = await import("../../../../src/app/api/admin/games/verify-deletion/route");

function makeRequest(url: string, body: any) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as any;
}

beforeEach(() => {
  mockRequireAdmin = undefined;
  mockVerifyConsistency = undefined;
});

describe("POST /api/admin/games/verify-deletion", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";

  test("returns 403 when not admin", async () => {
    mockRequireAdmin = () => {
      throw new Error("Admin access required");
    };
    const res = await POST(
      makeRequest("http://localhost/api/admin/games/verify-deletion", { game_ids: [validUuid] })
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("Admin access required");
  });

  test("returns 400 for missing game_ids", async () => {
    const res = await POST(makeRequest("http://localhost/api/admin/games/verify-deletion", {}));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid input data");
  });

  test("returns 400 for non-uuid game_ids", async () => {
    const res = await POST(
      makeRequest("http://localhost/api/admin/games/verify-deletion", { game_ids: ["not-a-uuid"] })
    );
    expect(res.status).toBe(400);
  });

  test("returns verification result on success", async () => {
    mockVerifyConsistency = () => Promise.resolve({ allDeleted: true, orphans: [] });

    const res = await POST(
      makeRequest("http://localhost/api/admin/games/verify-deletion", { game_ids: [validUuid] })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toBe("Deletion consistency verification completed");
    expect(json.gameIds).toEqual([validUuid]);
    expect(json.result).toEqual({ allDeleted: true, orphans: [] });
    expect(json.timestamp).toBeDefined();
  });
});
