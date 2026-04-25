import { describe, test, expect, beforeEach, vi } from "vitest";

let mockRequireAdmin: any;
let mockSupabaseFrom: any;

vi.mock("../../../../src/lib/auth-admin", () => ({
  requireAdmin: () => (mockRequireAdmin ? mockRequireAdmin() : Promise.resolve(true)),
}));

vi.mock("../../../../src/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      from: (t: string) => mockSupabaseFrom?.(t) ?? {},
    }),
}));

vi.mock("../../../../src/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const {
  GET,
  PUT,
  DELETE: DELETE_HANDLER,
} = await import("../../../../src/app/api/admin/companies/[slug]/route");

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init) as any;
}

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
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

describe("GET /api/admin/companies/[slug]", () => {
  test("returns 403 when not admin", async () => {
    mockRequireAdmin = () => {
      throw new Error("Admin access required");
    };
    const res = await GET(
      makeRequest("http://localhost/api/admin/companies/studio-a"),
      makeParams("studio-a")
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("Admin access required");
  });

  test("returns company by slug", async () => {
    const companyRow = {
      id: "c1",
      name: "Studio A",
      slug: "studio-a",
      website_url: null,
      logo_url: null,
      founded_year: 2020,
      headquarters: "Paris",
      company_type: "developer",
      is_active: true,
      company_translations: [{ company_id: "c1", language_code: "fr", description: "Desc FR" }],
    };

    mockSupabaseFrom = (table: string) => {
      if (table === "companies") return supaChain({ data: companyRow, error: null });
      if (table === "game_companies") return supaChain({ count: 3, error: null });
      return supaChain({ data: [], error: null });
    };

    const res = await GET(
      makeRequest("http://localhost/api/admin/companies/studio-a"),
      makeParams("studio-a")
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.company.name).toBe("Studio A");
    expect(json.company.gameCount).toBe(3);
    expect(json.company.translations).toHaveLength(1);
  });

  test("returns 404 when company not found", async () => {
    mockSupabaseFrom = () => supaChain({ data: null, error: { code: "PGRST116" } });

    const res = await GET(
      makeRequest("http://localhost/api/admin/companies/nope"),
      makeParams("nope")
    );
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/admin/companies/[slug]", () => {
  test("returns 403 when not admin", async () => {
    mockRequireAdmin = () => {
      throw new Error("Admin access required");
    };
    const res = await PUT(
      makeRequest("http://localhost/api/admin/companies/studio-a", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "X" }),
      }),
      makeParams("studio-a")
    );
    expect(res.status).toBe(403);
  });

  test("returns 400 for invalid body", async () => {
    const res = await PUT(
      makeRequest("http://localhost/api/admin/companies/studio-a", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      }),
      makeParams("studio-a")
    );
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/admin/companies/[slug]", () => {
  test("returns 403 when not admin", async () => {
    mockRequireAdmin = () => {
      throw new Error("Admin access required");
    };
    const res = await DELETE_HANDLER(
      makeRequest("http://localhost/api/admin/companies/studio-a"),
      makeParams("studio-a")
    );
    expect(res.status).toBe(403);
  });

  test("returns 404 when company not found", async () => {
    mockSupabaseFrom = () => supaChain({ data: null, error: { code: "PGRST116" } });

    const res = await DELETE_HANDLER(
      makeRequest("http://localhost/api/admin/companies/nope"),
      makeParams("nope")
    );
    expect(res.status).toBe(404);
  });

  test("deletes company successfully", async () => {
    mockSupabaseFrom = (table: string) => {
      if (table === "companies")
        return supaChain({ data: { id: "c1", slug: "studio-a" }, error: null });
      if (table === "game_companies") return supaChain({ count: 0, error: null });
      if (table === "company_translations") return supaChain({ error: null });
      return supaChain({ error: null });
    };

    const res = await DELETE_HANDLER(
      makeRequest("http://localhost/api/admin/companies/studio-a"),
      makeParams("studio-a")
    );
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });
});
