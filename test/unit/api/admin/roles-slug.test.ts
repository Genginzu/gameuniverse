import { describe, test, expect, beforeEach, vi } from "vitest";

let mockRequireAdmin: any;
let mockSupabaseFrom: any;

vi.mock("../../../../src/lib/auth-admin", () => ({
  requireAdmin: () =>
    mockRequireAdmin ? mockRequireAdmin() : Promise.resolve(true),
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

const { GET, PUT, DELETE: DELETE_HANDLER } = await import(
  "../../../../src/app/api/admin/roles/[slug]/route"
);

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

describe("GET /api/admin/roles/[slug]", () => {
  test("returns 403 when not admin", async () => {
    mockRequireAdmin = () => {
      throw new Error("Admin access required");
    };
    const res = await GET(
      makeRequest("http://localhost/api/admin/roles/protagonist"),
      makeParams("protagonist")
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("Admin access required");
  });

  test("returns role by slug", async () => {
    const roleRow = {
      id: "r1",
      slug: "protagonist",
      character_role_translations: [
        { role_id: "r1", language_code: "fr", name: "Protagoniste", description: "Héros" },
      ],
    };

    mockSupabaseFrom = (table: string) => {
      if (table === "character_roles") return supaChain({ data: roleRow, error: null });
      if (table === "character_character_roles") return supaChain({ count: 5, error: null });
      return supaChain({ data: [], error: null });
    };

    const res = await GET(
      makeRequest("http://localhost/api/admin/roles/protagonist"),
      makeParams("protagonist")
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.role.slug).toBe("protagonist");
    expect(json.role.characterCount).toBe(5);
    expect(json.role.translations).toHaveLength(1);
    expect(json.role.translations[0].name).toBe("Protagoniste");
  });

  test("returns 404 when role not found", async () => {
    mockSupabaseFrom = () => supaChain({ data: null, error: { code: "PGRST116" } });

    const res = await GET(
      makeRequest("http://localhost/api/admin/roles/nope"),
      makeParams("nope")
    );
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/admin/roles/[slug]", () => {
  test("returns 403 when not admin", async () => {
    mockRequireAdmin = () => {
      throw new Error("Admin access required");
    };
    const res = await PUT(
      makeRequest("http://localhost/api/admin/roles/protagonist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translations: [] }),
      }),
      makeParams("protagonist")
    );
    expect(res.status).toBe(403);
  });

  test("returns 400 for invalid body", async () => {
    const res = await PUT(
      makeRequest("http://localhost/api/admin/roles/protagonist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translations: [] }),
      }),
      makeParams("protagonist")
    );
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/admin/roles/[slug]", () => {
  test("returns 403 when not admin", async () => {
    mockRequireAdmin = () => {
      throw new Error("Admin access required");
    };
    const res = await DELETE_HANDLER(
      makeRequest("http://localhost/api/admin/roles/protagonist"),
      makeParams("protagonist")
    );
    expect(res.status).toBe(403);
  });

  test("returns 404 when role not found", async () => {
    mockSupabaseFrom = () => supaChain({ data: null, error: { code: "PGRST116" } });

    const res = await DELETE_HANDLER(
      makeRequest("http://localhost/api/admin/roles/nope"),
      makeParams("nope")
    );
    expect(res.status).toBe(404);
  });

  test("deletes role successfully", async () => {
    mockSupabaseFrom = (table: string) => {
      if (table === "character_roles")
        return supaChain({ data: { id: "r1", slug: "protagonist" }, error: null });
      if (table === "character_character_roles") return supaChain({ count: 0, error: null });
      if (table === "character_role_translations") return supaChain({ error: null });
      return supaChain({ error: null });
    };

    const res = await DELETE_HANDLER(
      makeRequest("http://localhost/api/admin/roles/protagonist"),
      makeParams("protagonist")
    );
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });
});
