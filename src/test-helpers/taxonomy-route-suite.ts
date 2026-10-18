/**
 * Shared test suite for admin character taxonomy routes (genders, species).
 *
 * Both routes share the same contract (slug + translations, character count,
 * FK set to NULL on delete), so the suite runs against the real handlers of
 * each route with a queue-based Supabase mock.
 */

import { describe, test, expect, beforeEach, type Mock } from "vitest";
import type { NextRequest } from "next/server";
import type { SupabaseQueryMock } from "./supabase-query-mock";

type ListHandler = (request: NextRequest) => Promise<Response>;
type DetailHandler = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => Promise<Response>;

export interface TaxonomyRouteSuiteConfig {
  basePath: string;
  table: string;
  translationsTable: string;
  foreignKey: string;
  listKey: string;
  itemKey: string;
  notFoundMessage: string;
  db: SupabaseQueryMock;
  requireAdmin: Mock;
  list: { GET: ListHandler; POST: ListHandler };
  detail: { GET: DetailHandler; PUT: DetailHandler; DELETE: DetailHandler };
}

const ID_A = "00000000-0000-0000-0000-00000000000a";
const ID_B = "00000000-0000-0000-0000-00000000000b";
const VALID_PAYLOAD = {
  slug: "sample-slug",
  translations: [
    { language_code: "fr", name: "Exemple" },
    { language_code: "en", name: "Sample" },
  ],
};

function makeRequest(url: string, method = "GET", body?: unknown): NextRequest {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }
  return new Request(url, init) as unknown as NextRequest;
}

export function runTaxonomyRouteSuite(config: TaxonomyRouteSuiteConfig) {
  const { db, table, translationsTable, foreignKey, listKey, itemKey } = config;
  const listUrl = `http://localhost${config.basePath}`;
  const detailUrl = `${listUrl}/${ID_A}`;
  const ctx = (id = ID_A) => ({ params: Promise.resolve({ id }) });

  const row = (id: string, slug: string, names: Record<string, string>) => ({
    id,
    slug,
    igdb_id: null,
    [translationsTable]: Object.entries(names).map(([language_code, name]) => ({
      [foreignKey]: id,
      language_code,
      name,
    })),
  });

  beforeEach(() => {
    db.reset();
    config.requireAdmin.mockReset();
    config.requireAdmin.mockResolvedValue(true);
  });

  describe("auth", () => {
    test("every handler maps the admin guard error to 403", async () => {
      config.requireAdmin.mockRejectedValue(new Error("Admin access required"));
      const responses = await Promise.all([
        config.list.GET(makeRequest(listUrl)),
        config.list.POST(makeRequest(listUrl, "POST", VALID_PAYLOAD)),
        config.detail.GET(makeRequest(detailUrl), ctx()),
        config.detail.PUT(makeRequest(detailUrl, "PUT", VALID_PAYLOAD), ctx()),
        config.detail.DELETE(makeRequest(detailUrl, "DELETE"), ctx()),
      ]);
      for (const res of responses) {
        expect(res.status).toBe(403);
        expect(await res.json()).toEqual({ error: "Admin access required" });
      }
    });
  });

  describe(`GET ${config.basePath}`, () => {
    test("returns 400 for invalid query parameters", async () => {
      const res = await config.list.GET(makeRequest(`${listUrl}?limit=101`));
      expect(res.status).toBe(400);
    });

    test("returns items with pagination and character counts", async () => {
      db.enqueue(
        table,
        { count: 3 },
        { data: [row(ID_A, "alpha", { fr: "Alpha" }), row(ID_B, "beta", { fr: "Beta" })] }
      );
      db.enqueue("characters", {
        data: [{ [foreignKey]: ID_A }, { [foreignKey]: ID_A }, { [foreignKey]: ID_B }],
      });

      const res = await config.list.GET(makeRequest(`${listUrl}?limit=2`));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body[listKey]).toEqual([
        {
          id: ID_A,
          slug: "alpha",
          characterCount: 2,
          translations: [{ language_code: "fr", name: "Alpha" }],
        },
        {
          id: ID_B,
          slug: "beta",
          characterCount: 1,
          translations: [{ language_code: "fr", name: "Beta" }],
        },
      ]);
      expect(body.pagination).toEqual({
        currentPage: 1,
        totalPages: 2,
        totalCount: 3,
        limit: 2,
        hasNextPage: true,
        hasPreviousPage: false,
      });
      expect(db.callsFor(table, "range")).toEqual([[0, 1]]);
    });

    test("sorts by translated name for the requested locale", async () => {
      db.enqueue(
        table,
        { count: 2 },
        { data: [row(ID_A, "aaa", { en: "Zebra" }), row(ID_B, "bbb", { en: "Ant" })] }
      );

      const res = await config.list.GET(makeRequest(`${listUrl}?sort_by=name&locale=en`));
      const body = await res.json();

      expect(body[listKey].map((item: { slug: string }) => item.slug)).toEqual(["bbb", "aaa"]);
    });

    test("searches slugs and translated names", async () => {
      db.enqueue(translationsTable, { data: [{ [foreignKey]: ID_A }] });
      db.enqueue(table, { count: 1 }, { data: [row(ID_A, "alpha", { fr: "Alpha" })] });

      const res = await config.list.GET(makeRequest(`${listUrl}?search=alp`));

      expect(res.status).toBe(200);
      expect(db.callsFor(translationsTable, "ilike")).toEqual([["name", "%alp%"]]);
      expect(db.callsFor(table, "or")[0]).toEqual([`slug.ilike.%alp%,id.in.(${ID_A})`]);
    });

    test("returns 500 when the count query fails", async () => {
      db.enqueue(table, { error: { message: "boom" } });
      const res = await config.list.GET(makeRequest(listUrl));
      expect(res.status).toBe(500);
    });
  });

  describe(`POST ${config.basePath}`, () => {
    test.each(["", "a", "A", "1abc", "ab cd"])("rejects invalid slug %j with 400", async (slug) => {
      const res = await config.list.POST(makeRequest(listUrl, "POST", { ...VALID_PAYLOAD, slug }));
      expect(res.status).toBe(400);
    });

    test("rejects missing or empty translations with 400", async () => {
      const missing = await config.list.POST(makeRequest(listUrl, "POST", { slug: "valid" }));
      const empty = await config.list.POST(
        makeRequest(listUrl, "POST", { slug: "valid", translations: [] })
      );
      expect(missing.status).toBe(400);
      expect(empty.status).toBe(400);
    });

    test("creates the item and its translations, returns 201", async () => {
      db.enqueue(table, { data: { id: ID_A, slug: VALID_PAYLOAD.slug } });
      db.enqueue(translationsTable, {});

      const res = await config.list.POST(makeRequest(listUrl, "POST", VALID_PAYLOAD));
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body[itemKey]).toEqual({
        id: ID_A,
        slug: VALID_PAYLOAD.slug,
        characterCount: 0,
        translations: VALID_PAYLOAD.translations,
      });
      expect(db.callsFor(translationsTable, "insert")).toEqual([
        [VALID_PAYLOAD.translations.map((t) => ({ [foreignKey]: ID_A, ...t }))],
      ]);
    });

    test("returns 409 on duplicate slug", async () => {
      db.enqueue(table, { error: { code: "23505" } });
      const res = await config.list.POST(makeRequest(listUrl, "POST", VALID_PAYLOAD));
      expect(res.status).toBe(409);
      expect((await res.json()).error).toContain("slug already exists");
    });

    test("rolls back the item when translation insert fails", async () => {
      db.enqueue(table, { data: { id: ID_A, slug: VALID_PAYLOAD.slug } }, {});
      db.enqueue(translationsTable, { error: { message: "boom" } });

      const res = await config.list.POST(makeRequest(listUrl, "POST", VALID_PAYLOAD));

      expect(res.status).toBe(500);
      expect(db.callsFor(table, "delete")).toHaveLength(1);
      expect(db.callsFor(table, "eq")).toContainEqual(["id", ID_A]);
    });
  });

  describe(`GET ${config.basePath}/[id]`, () => {
    test("returns 404 when the item does not exist", async () => {
      db.enqueue(table, { error: { code: "PGRST116" } });
      const res = await config.detail.GET(makeRequest(detailUrl), ctx());
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: config.notFoundMessage });
    });

    test("returns the item with igdbId and character count", async () => {
      db.enqueue(table, { data: row(ID_A, "alpha", { fr: "Alpha", en: "Alpha EN" }) });
      db.enqueue("characters", { count: 4 });

      const res = await config.detail.GET(makeRequest(detailUrl), ctx());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body[itemKey]).toMatchObject({
        id: ID_A,
        slug: "alpha",
        igdbId: null,
        characterCount: 4,
      });
      expect(body[itemKey].translations).toHaveLength(2);
    });
  });

  describe(`PUT ${config.basePath}/[id]`, () => {
    test("returns 400 for invalid payload", async () => {
      const res = await config.detail.PUT(
        makeRequest(detailUrl, "PUT", { slug: "", translations: [] }),
        ctx()
      );
      expect(res.status).toBe(400);
    });

    test("returns 404 when the item does not exist", async () => {
      db.enqueue(table, { data: null });
      const res = await config.detail.PUT(makeRequest(detailUrl, "PUT", VALID_PAYLOAD), ctx());
      expect(res.status).toBe(404);
    });

    test("returns 409 on duplicate slug", async () => {
      db.enqueue(table, { data: { id: ID_A } }, { error: { code: "23505" } });
      const res = await config.detail.PUT(makeRequest(detailUrl, "PUT", VALID_PAYLOAD), ctx());
      expect(res.status).toBe(409);
    });

    test("updates slug, upserts translations and returns the item", async () => {
      db.enqueue(
        table,
        { data: { id: ID_A } },
        {},
        { data: row(ID_A, VALID_PAYLOAD.slug, { fr: "Exemple" }) }
      );
      db.enqueue(translationsTable, {});
      db.enqueue("characters", { count: 1 });

      const res = await config.detail.PUT(makeRequest(detailUrl, "PUT", VALID_PAYLOAD), ctx());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body[itemKey]).toMatchObject({ slug: VALID_PAYLOAD.slug, characterCount: 1 });
      expect(db.callsFor(translationsTable, "upsert")[0][1]).toEqual({
        onConflict: `${foreignKey},language_code`,
      });
    });
  });

  describe(`DELETE ${config.basePath}/[id]`, () => {
    test("returns 404 when the item does not exist", async () => {
      db.enqueue(table, { data: null });
      const res = await config.detail.DELETE(makeRequest(detailUrl, "DELETE"), ctx());
      expect(res.status).toBe(404);
    });

    test("deletes translations then the item and reports affected characters", async () => {
      db.enqueue(table, { data: { id: ID_A } }, {});
      db.enqueue("characters", { count: 3 });
      db.enqueue(translationsTable, {});

      const res = await config.detail.DELETE(makeRequest(detailUrl, "DELETE"), ctx());

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ success: true, characterCount: 3 });
      const deletes = db.calls.filter((c) => c.method === "delete").map((c) => c.table);
      expect(deletes).toEqual([translationsTable, table]);
    });

    test("returns 500 when the delete fails", async () => {
      db.enqueue(table, { data: { id: ID_A } }, { error: { message: "boom" } });
      db.enqueue("characters", { count: 0 });
      db.enqueue(translationsTable, {});

      const res = await config.detail.DELETE(makeRequest(detailUrl, "DELETE"), ctx());
      expect(res.status).toBe(500);
    });
  });
}
