import { describe, test, expect, beforeEach, vi } from "vitest";

let mockRequireAdmin: any;
let mockSupabaseFrom: any;

vi.mock("@/lib/auth-admin", () => ({
  requireAdmin: () =>
    mockRequireAdmin ? mockRequireAdmin() : Promise.resolve(true),
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      from: (t: string) => mockSupabaseFrom?.(t) ?? {},
    }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const { GET, POST } = await import(
  "@/app/api/admin/age-classifications/route"
);

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init) as any;
}

function supaChain(result: { data?: any; error?: any; count?: number }) {
  const c: any = new Proxy(
    {},
    {
      get: (_, prop) => {
        if (prop === "then") return (resolve: any) => resolve(result);
        return () => c;
      },
    }
  );
  return c;
}

beforeEach(() => {
  mockRequireAdmin = undefined;
  mockSupabaseFrom = undefined;
});

describe("GET /api/admin/age-classifications", () => {
  test("returns 403 when not admin", async () => {
    mockRequireAdmin = () => {
      throw new Error("Admin access required");
    };
    const res = await GET(
      makeRequest("http://localhost/api/admin/age-classifications")
    );
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Admin access required" });
  });

  test("returns paginated rating systems", async () => {
    const system = {
      id: "rs1",
      code: "PEGI",
      name: "PEGI",
      description: null,
      country_codes: ["FR"],
      website_url: null,
    };

    mockSupabaseFrom = (table: string) => {
      if (table === "rating_systems")
        return supaChain({ data: [system], error: null, count: 1 });
      if (table === "ratings" || table === "content_descriptors")
        return supaChain({ count: 2, error: null });
      return {};
    };

    const res = await GET(
      makeRequest("http://localhost/api/admin/age-classifications")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("ratingSystems");
    expect(body).toHaveProperty("pagination");
    expect(body.pagination).toHaveProperty("currentPage", 1);
    expect(body.ratingSystems[0].code).toBe("PEGI");
  });

  test("returns 500 when count query fails", async () => {
    mockSupabaseFrom = () =>
      supaChain({ count: null, error: { message: "DB error" } });

    const res = await GET(
      makeRequest("http://localhost/api/admin/age-classifications")
    );
    expect(res.status).toBe(500);
  });
});

describe("POST /api/admin/age-classifications", () => {
  test("returns 403 when not admin", async () => {
    mockRequireAdmin = () => {
      throw new Error("Admin access required");
    };
    const res = await POST(
      makeRequest("http://localhost/api/admin/age-classifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "PEGI", name: "PEGI" }),
      })
    );
    expect(res.status).toBe(403);
  });

  test("returns 400 for invalid body", async () => {
    const res = await POST(
      makeRequest("http://localhost/api/admin/age-classifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "", name: "" }),
      })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid input data");
  });

  test("returns 201 on success", async () => {
    const created = {
      id: "rs1",
      code: "ESRB",
      name: "ESRB",
      description: null,
      country_codes: ["US"],
      website_url: null,
    };

    mockSupabaseFrom = () => ({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: created, error: null }),
        }),
      }),
    });

    const res = await POST(
      makeRequest("http://localhost/api/admin/age-classifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "ESRB",
          name: "ESRB",
          country_codes: ["US"],
        }),
      })
    );
    expect(res.status).toBe(201);
    expect((await res.json()).ratingSystem.code).toBe("ESRB");
  });

  test("returns 409 when code already exists", async () => {
    mockSupabaseFrom = () => ({
      insert: () => ({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: null,
              error: { code: "23505", message: "duplicate" },
            }),
        }),
      }),
    });

    const res = await POST(
      makeRequest("http://localhost/api/admin/age-classifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "PEGI", name: "PEGI" }),
      })
    );
    expect(res.status).toBe(409);
  });
});
