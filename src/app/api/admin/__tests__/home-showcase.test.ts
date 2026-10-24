import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";
import { useTestRouteEnvironment } from "@/test-helpers/route-environment";

const mock = createSupabaseQueryMock();
const routeEnv = useTestRouteEnvironment({ signedInAs: "admin" });

vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: () => mock.client }));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { GET, POST, PUT } = await import("@/app/api/admin/home-showcase/route");
const { PATCH, DELETE } = await import("@/app/api/admin/home-showcase/[id]/route");

const ID = "22222222-2222-4222-8222-222222222222";

function request(method: string, body?: unknown) {
  return new Request("http://localhost/api/admin/home-showcase?locale=fr", {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  }) as never;
}

const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  mock.reset();
});

describe("admin home showcase API", () => {
  it("rejects non-admin callers before touching the database", async () => {
    routeEnv.signIn("user");

    const response = await POST(request("POST", { kind: "game", entityId: ID }));

    expect(response.status).toBe(403);
    expect(mock.calls).toHaveLength(0);
  });

  it("rejects signed-out callers with 401", async () => {
    routeEnv.signOut();

    const response = await DELETE(request("DELETE"), params(ID));

    expect(response.status).toBe(401);
    expect(mock.calls).toHaveLength(0);
  });

  it("lists items", async () => {
    mock.enqueue("home_showcase_items", { data: [] });
    const response = await GET(
      Object.assign(request("GET"), { nextUrl: new URL("http://localhost/x?locale=en") })
    );
    expect(await response.json()).toEqual({ items: [] });
  });

  it("validates the POST body", async () => {
    const response = await POST(request("POST", { kind: "game", entityId: "not-a-uuid" }));
    expect(response.status).toBe(400);
  });

  it("returns 409 for a duplicate item", async () => {
    mock.enqueue("home_showcase_items", { data: [] }, { error: { code: "23505" } });
    const response = await POST(request("POST", { kind: "character", entityId: ID }));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "duplicate" });
  });

  it("returns 422 when the limit is reached", async () => {
    mock.enqueue("home_showcase_items", {
      data: [0, 1, 2, 3].map((order) => ({ display_order: order })),
    });
    const response = await POST(request("POST", { kind: "character", entityId: ID }));
    expect(response.status).toBe(422);
  });

  it("reorders items", async () => {
    mock.enqueue("home_showcase_items", {});
    const response = await PUT(request("PUT", { kind: "game", ids: [ID] }));
    expect(response.status).toBe(200);
  });

  it("rejects an invalid status and an invalid id", async () => {
    expect((await PATCH(request("PATCH", { libraryStatus: "x" }), params(ID))).status).toBe(400);
    expect((await DELETE(request("DELETE"), params("nope"))).status).toBe(400);
  });

  it("deletes an item", async () => {
    mock.enqueue("home_showcase_items", {});
    const response = await DELETE(request("DELETE"), params(ID));
    expect(response.status).toBe(200);
  });
});
