import { describe, test, expect, beforeEach, vi } from "vitest";

let mockRequireAdmin: (() => Promise<boolean>) | undefined;
let storesResult: { data?: unknown; error?: unknown };
let lastUpdate: unknown;

function supaChain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  const self: unknown = new Proxy(c, {
    get: (_, prop) => {
      if (prop === "then") return (resolve: (r: unknown) => void) => resolve(result);
      if (prop === "update") {
        return (payload: unknown) => {
          lastUpdate = payload;
          return self;
        };
      }
      return () => self;
    },
  });
  return self;
}

vi.mock("@/lib/auth-admin", () => ({
  requireAdmin: () => (mockRequireAdmin ? mockRequireAdmin() : Promise.resolve(true)),
}));
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () => Promise.resolve({ from: () => supaChain(storesResult) }),
}));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const { GET } = await import("@/app/api/admin/stores/route");
const { PUT } = await import("@/app/api/admin/stores/[id]/route");

const STORE_ID = "11111111-2222-3333-4444-555555555555";
const ROW = {
  id: STORE_ID,
  name: "Amazon",
  website_url: "https://www.amazon.fr",
  logo_url: null,
  is_active: true,
  affiliate_enabled: true,
  affiliate_network: "amazon",
  affiliate_tag: "gu-21",
  affiliate_url_template: null,
};

function putRequest(body: unknown) {
  return new Request(`http://localhost/api/admin/stores/${STORE_ID}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as never;
}

const params = (id = STORE_ID) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  mockRequireAdmin = undefined;
  storesResult = { data: [ROW], error: null };
  lastUpdate = undefined;
});

describe("GET /api/admin/stores", () => {
  test("returns 403 when not admin", async () => {
    mockRequireAdmin = () => Promise.reject(new Error("Admin access required"));
    const res = await GET();
    expect(res.status).toBe(403);
  });

  test("returns mapped stores", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stores[0]).toMatchObject({
      id: STORE_ID,
      websiteUrl: "https://www.amazon.fr",
      affiliateEnabled: true,
      affiliateNetwork: "amazon",
      affiliateTag: "gu-21",
    });
  });
});

describe("PUT /api/admin/stores/[id]", () => {
  test("returns 403 when not admin", async () => {
    mockRequireAdmin = () => Promise.reject(new Error("Admin access required"));
    const res = await PUT(putRequest({ affiliateEnabled: false }), params());
    expect(res.status).toBe(403);
  });

  test("rejects an invalid store id", async () => {
    const res = await PUT(putRequest({ affiliateEnabled: false }), params("nope"));
    expect(res.status).toBe(400);
  });

  test("rejects an invalid payload", async () => {
    const res = await PUT(
      putRequest({ affiliateEnabled: true, affiliateNetwork: "awin" }),
      params()
    );
    expect(res.status).toBe(400);
    expect(lastUpdate).toBeUndefined();
  });

  test("persists the affiliate configuration", async () => {
    storesResult = { data: ROW, error: null };
    const res = await PUT(
      putRequest({ affiliateEnabled: true, affiliateNetwork: "amazon", affiliateTag: "gu-21" }),
      params()
    );
    expect(res.status).toBe(200);
    expect(lastUpdate).toEqual({
      affiliate_enabled: true,
      affiliate_network: "amazon",
      affiliate_tag: "gu-21",
      affiliate_url_template: null,
    });
    expect((await res.json()).store.name).toBe("Amazon");
  });

  test("returns 404 when the store does not exist", async () => {
    storesResult = { data: null, error: null };
    const res = await PUT(putRequest({ affiliateEnabled: false }), params());
    expect(res.status).toBe(404);
  });
});
