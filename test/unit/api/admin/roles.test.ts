import { describe, test, expect, beforeEach, vi } from "vitest";

let mockRequireAdmin: any;
let mockSupabaseFrom: any;

vi.mock("../../../../src/lib/auth-admin", () => ({
  requireAdmin: () =>
    mockRequireAdmin
      ? mockRequireAdmin()
      : Promise.resolve(true),
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

const { GET, POST } = await import(
  "../../../../src/app/api/admin/roles/route"
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

describe("GET /api/admin/roles", () => {
  test("returns 403 when not admin", async () => {
    mockRequireAdmin = () => {
      throw new Error("Admin access required");
    };
    const res = await GET(makeRequest("http://localhost/api/admin/roles"));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Admin access required" });
  });

  test("returns paginated roles with translations", async () => {
    const role = {
      id: "r1",
      slug: "protagonist",
      character_role_translations: [
        { role_id: "r1", language_code: "fr", name: "Protagoniste", description: "Héros" },
        { role_id: "r1", language_code: "en", name: "Protagonist", description: "Hero" },
      ],
    };

    mockSupabaseFrom = (table: string) => {
      if (table === "character_role_translations") {
        return supaChain({ data: [], error: null });
      }
      if (table === "character_roles") {
        return supaChain({ data: [role], error: null, count: 1 });
      }
      if (table === "character_character_roles") {
        return supaChain({ data: [{ role_id: "r1" }, { role_id: "r1" }], error: null });
      }
      return supaChain({ data: [], error: null });
    };

    const res = await GET(
      makeRequest("http://localhost/api/admin/roles?page=1&limit=20&locale=fr")
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.roles).toHaveLength(1);
    expect(json.roles[0].slug).toBe("protagonist");
    expect(json.roles[0].characterCount).toBe(2);
    expect(json.roles[0].translations).toHaveLength(2);
    expect(json.pagination.totalCount).toBe(1);
  });
});

describe("POST /api/admin/roles", () => {
  test("returns 403 when not admin", async () => {
    mockRequireAdmin = () => {
      throw new Error("Admin access required");
    };
    const res = await POST(
      makeRequest("http://localhost/api/admin/roles", {
        method: "POST",
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(403);
  });

  test("returns 400 for invalid body", async () => {
    const res = await POST(
      makeRequest("http://localhost/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "" }),
      })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid input data");
  });

  test("returns 201 on success with translations", async () => {
    const inserted = { id: "r2", slug: "antagonist" };

    mockSupabaseFrom = (table: string) => {
      if (table === "character_roles") {
        return supaChain({ data: inserted, error: null });
      }
      if (table === "character_role_translations") {
        return supaChain({ data: null, error: null });
      }
      return supaChain({ data: null, error: null });
    };

    const res = await POST(
      makeRequest("http://localhost/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "antagonist",
          translations: [
            { language_code: "fr", name: "Antagoniste", description: "Méchant" },
            { language_code: "en", name: "Antagonist", description: "Villain" },
          ],
        }),
      })
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.role.id).toBe("r2");
    expect(json.role.slug).toBe("antagonist");
    expect(json.role.characterCount).toBe(0);
    expect(json.role.translations).toHaveLength(2);
  });

  test("returns 409 on duplicate slug", async () => {
    mockSupabaseFrom = () =>
      supaChain({ data: null, error: { code: "23505", message: "duplicate" } });

    const res = await POST(
      makeRequest("http://localhost/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "protagonist",
          translations: [{ language_code: "fr", name: "Protagoniste" }],
        }),
      })
    );
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain("already exists");
  });
});
