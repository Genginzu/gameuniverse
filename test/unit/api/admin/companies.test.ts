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

const { GET, POST } = await import("../../../../src/app/api/admin/companies/route");

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

describe("GET /api/admin/companies", () => {
  test("returns 403 when not admin", async () => {
    mockRequireAdmin = () => {
      throw new Error("Admin access required");
    };
    const res = await GET(makeRequest("http://localhost/api/admin/companies"));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Admin access required" });
  });

  test("returns paginated companies", async () => {
    const company = {
      id: "c1",
      name: "Studio A",
      slug: "studio-a",
      website_url: null,
      logo_url: null,
      founded_year: 2020,
      headquarters: null,
      company_type: "developer",
      is_active: true,
      company_translations: [{ company_id: "c1", language_code: "fr", description: "Desc FR" }],
    };

    mockSupabaseFrom = (table: string) => {
      if (table === "companies") {
        return supaChain({ data: [company], error: null, count: 1 });
      }
      if (table === "game_companies") {
        return supaChain({ data: [{ company_id: "c1" }], error: null });
      }
      return supaChain({ data: [], error: null });
    };

    const res = await GET(makeRequest("http://localhost/api/admin/companies?page=1&limit=20"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.companies).toHaveLength(1);
    expect(json.companies[0].name).toBe("Studio A");
    expect(json.companies[0].gameCount).toBe(1);
    expect(json.pagination.totalCount).toBe(1);
  });
});

describe("POST /api/admin/companies", () => {
  test("returns 403 when not admin", async () => {
    mockRequireAdmin = () => {
      throw new Error("Admin access required");
    };
    const res = await POST(
      makeRequest("http://localhost/api/admin/companies", {
        method: "POST",
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(403);
  });

  test("returns 400 for invalid body", async () => {
    const res = await POST(
      makeRequest("http://localhost/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid input data");
  });

  test("returns 201 on success", async () => {
    const inserted = {
      id: "c2",
      name: "Publisher B",
      slug: "publisher-b",
      website_url: null,
      logo_url: null,
      founded_year: null,
      headquarters: null,
      company_type: "publisher",
      is_active: true,
    };

    mockSupabaseFrom = (table: string) => {
      if (table === "companies") {
        return supaChain({ data: inserted, error: null });
      }
      if (table === "company_translations") {
        return supaChain({ data: null, error: null });
      }
      return supaChain({ data: null, error: null });
    };

    const res = await POST(
      makeRequest("http://localhost/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Publisher B",
          slug: "publisher-b",
          company_type: "publisher",
          translations: [{ language_code: "fr", description: "Desc" }],
        }),
      })
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.company.id).toBe("c2");
    expect(json.company.gameCount).toBe(0);
    expect(json.company.translations).toHaveLength(1);
  });

  test("returns 409 on duplicate (error code 23505)", async () => {
    mockSupabaseFrom = () =>
      supaChain({ data: null, error: { code: "23505", message: "duplicate" } });

    const res = await POST(
      makeRequest("http://localhost/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Dup Co",
          slug: "dup-co",
          company_type: "developer",
        }),
      })
    );
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain("already exists");
  });
});
