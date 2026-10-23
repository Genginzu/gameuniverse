import { describe, it, expect, beforeEach, vi } from "vitest";
import type { NextRequest } from "next/server";

type Row = Record<string, unknown>;

let tables: Record<string, Row[]>;
let failingTable: string | null;
let mutations: string[];
let requireAdminImpl: () => Promise<unknown>;

function queryFor(table: string) {
  const filters: [string, unknown][] = [];
  let countMode = false;
  const rows = () => (tables[table] ?? []).filter((row) => filters.every(([c, v]) => row[c] === v));
  const builder = {
    select: (_columns: string, options?: { count?: string; head?: boolean }) => {
      countMode = options?.count === "exact";
      return builder;
    },
    eq: (column: string, value: unknown) => {
      filters.push([column, value]);
      return builder;
    },
    maybeSingle: () => Promise.resolve({ data: rows()[0] ?? null, error: null }),
    then: (resolve: (value: unknown) => void) => {
      if (failingTable === table) return resolve({ count: null, error: { message: "boom" } });
      return resolve(countMode ? { count: rows().length, error: null } : { data: rows() });
    },
    delete: () => {
      mutations.push(`delete:${table}`);
      return builder;
    },
    update: () => {
      mutations.push(`update:${table}`);
      return builder;
    },
  };
  return builder;
}

vi.mock("@/lib/auth-admin", () => ({ requireAdmin: () => requireAdminImpl() }));
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () => Promise.resolve({ from: (table: string) => queryFor(table) }),
}));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

const { createAdminUsageRoute } = await import("@/lib/services/adminUsageRoute");

const request = {} as NextRequest;
const params = (values: Record<string, string>) => ({ params: Promise.resolve(values) });

const genreUsage = createAdminUsageRoute({
  table: "genres",
  keyColumn: "slug",
  param: "slug",
  references: [{ table: "game_genres", column: "genre_id" }],
});

describe("createAdminUsageRoute", () => {
  beforeEach(() => {
    requireAdminImpl = () => Promise.resolve(true);
    failingTable = null;
    mutations = [];
    tables = {
      genres: [{ id: "g1", slug: "rpg" }],
      game_genres: [{ genre_id: "g1" }, { genre_id: "g1" }, { genre_id: "other" }],
    };
  });

  it("returns the number of references to the entity", async () => {
    const res = await genreUsage(request, params({ slug: "rpg" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ usageCount: 2 });
  });

  it("returns zero for an unused entity and never mutates anything", async () => {
    tables.game_genres = [];
    const res = await genreUsage(request, params({ slug: "rpg" }));
    expect(await res.json()).toEqual({ usageCount: 0 });
    expect(mutations).toEqual([]);
    expect(tables.genres).toHaveLength(1);
  });

  it("returns 404 when the entity does not exist", async () => {
    const res = await genreUsage(request, params({ slug: "missing" }));
    expect(res.status).toBe(404);
  });

  it("returns 403 when the caller is not an admin", async () => {
    requireAdminImpl = () => Promise.reject(new Error("Admin access required"));
    const res = await genreUsage(request, params({ slug: "rpg" }));
    expect(res.status).toBe(403);
  });

  it("returns 500 when a count fails", async () => {
    failingTable = "game_genres";
    const res = await genreUsage(request, params({ slug: "rpg" }));
    expect(res.status).toBe(500);
  });

  it("sums every reference table and matches on the configured reference column", async () => {
    tables = {
      supported_languages: [{ code: "fr" }],
      game_languages: [{ language_code: "fr" }],
      other_refs: [{ lang: "fr" }, { lang: "fr" }],
    };
    const route = createAdminUsageRoute({
      table: "supported_languages",
      keyColumn: "code",
      refColumn: "code",
      param: "code",
      references: [
        { table: "game_languages", column: "language_code" },
        { table: "other_refs", column: "lang" },
      ],
    });
    const res = await route(request, params({ code: "fr" }));
    expect(await res.json()).toEqual({ usageCount: 3 });
  });
});

type UsageGet = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> }
) => Promise<Response>;

interface RouteCase {
  name: string;
  load: () => Promise<{ GET: UsageGet }>;
  routeParams: Record<string, string>;
  table: string;
  keyColumn: string;
  refTable: string;
  refColumn: string;
}

const routeCases: RouteCase[] = [
  {
    name: "genres",
    load: () => import("@/app/api/admin/genres/[slug]/usage/route"),
    routeParams: { slug: "k" },
    table: "genres",
    keyColumn: "slug",
    refTable: "game_genres",
    refColumn: "genre_id",
  },
  {
    name: "companies",
    load: () => import("@/app/api/admin/companies/[slug]/usage/route"),
    routeParams: { slug: "k" },
    table: "companies",
    keyColumn: "slug",
    refTable: "game_companies",
    refColumn: "company_id",
  },
  {
    name: "platforms",
    load: () => import("@/app/api/admin/platforms/[slug]/usage/route"),
    routeParams: { slug: "k" },
    table: "platforms",
    keyColumn: "slug",
    refTable: "game_platforms",
    refColumn: "platform_id",
  },
  {
    name: "roles",
    load: () => import("@/app/api/admin/roles/[slug]/usage/route"),
    routeParams: { slug: "k" },
    table: "character_roles",
    keyColumn: "slug",
    refTable: "character_character_roles",
    refColumn: "role_id",
  },
  {
    name: "genders",
    load: () => import("@/app/api/admin/genders/[id]/usage/route"),
    routeParams: { id: "k" },
    table: "genders",
    keyColumn: "id",
    refTable: "characters",
    refColumn: "gender_id",
  },
  {
    name: "species",
    load: () => import("@/app/api/admin/species/[id]/usage/route"),
    routeParams: { id: "k" },
    table: "species",
    keyColumn: "id",
    refTable: "characters",
    refColumn: "species_id",
  },
  {
    name: "languages",
    load: () => import("@/app/api/admin/languages/[code]/usage/route"),
    routeParams: { code: "k" },
    table: "supported_languages",
    keyColumn: "code",
    refTable: "game_languages",
    refColumn: "language_code",
  },
  {
    name: "ratings",
    load: () => import("@/app/api/admin/age-classifications/[id]/ratings/[ratingId]/usage/route"),
    routeParams: { id: "s", ratingId: "k" },
    table: "ratings",
    keyColumn: "id",
    refTable: "game_ratings",
    refColumn: "rating_id",
  },
  {
    name: "descriptors",
    load: () =>
      import("@/app/api/admin/age-classifications/[id]/descriptors/[descriptorId]/usage/route"),
    routeParams: { id: "s", descriptorId: "k" },
    table: "content_descriptors",
    keyColumn: "id",
    refTable: "game_rating_descriptors",
    refColumn: "content_descriptor_id",
  },
];

describe("admin usage routes", () => {
  beforeEach(() => {
    requireAdminImpl = () => Promise.resolve(true);
    failingTable = null;
    mutations = [];
  });

  it.each(routeCases)("$name usage counts references in $refTable", async (routeCase) => {
    const referenced = routeCase.keyColumn === "slug" ? "entity-id" : "k";
    tables = {
      [routeCase.table]: [{ id: referenced, [routeCase.keyColumn]: "k" }],
      [routeCase.refTable]: [{ [routeCase.refColumn]: referenced }],
    };
    const { GET } = await routeCase.load();
    const res = await GET(request, params(routeCase.routeParams));
    expect(await res.json()).toEqual({ usageCount: 1 });
    expect(mutations).toEqual([]);
  });

  it("age-classifications usage counts ratings and descriptors", async () => {
    tables = {
      rating_systems: [{ id: "k" }],
      ratings: [{ rating_system_id: "k" }],
      content_descriptors: [{ rating_system_id: "k" }, { rating_system_id: "k" }],
    };
    const { GET } = await import("@/app/api/admin/age-classifications/[id]/usage/route");
    const res = await GET(request, params({ id: "k" }));
    expect(await res.json()).toEqual({ usageCount: 3 });
  });
});
