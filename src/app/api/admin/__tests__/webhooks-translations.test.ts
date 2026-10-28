/**
 * Admin webhook and translation routes, run through the real route pipeline
 * with mocked data clients.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";
import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";

const db = createSupabaseQueryMock();
const mockRpc = vi.fn();
const mockTranslateFields = vi.fn();
const mockGetSourceText = vi.fn();
const mockUpsertTranslation = vi.fn();
const routeEnv = useTestRouteEnvironment({ signedInAs: "admin" });

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: async () => ({ from: db.client.from, rpc: mockRpc }),
}));
vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({ from: db.client.from, rpc: mockRpc }),
}));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock("@/lib/services/igdbService", () => ({
  IGDBService: { getAccessToken: vi.fn(async () => "token"), clearTokenCache: vi.fn() },
}));
vi.mock("@/lib/services/aiTranslateService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/services/aiTranslateService")>()),
  translateFields: (...args: unknown[]) => mockTranslateFields(...args),
}));
vi.mock("@/lib/services/translationAiSettingsService", () => ({
  getTranslationModel: vi.fn(async () => "anthropic/claude-haiku-4.5"),
}));
vi.mock("@/lib/services/translationService", () => ({
  getSourceText: (...args: unknown[]) => mockGetSourceText(...args),
  upsertTranslation: (...args: unknown[]) => mockUpsertTranslation(...args),
  listTranslationEntities: vi.fn(async () => ({ items: [], totalCount: 0 })),
  getEntityTranslationDetail: vi.fn(async () => null),
}));

const { GET: listEvents } = await import("@/app/api/admin/webhooks/events/route");
const { POST: linkEvents } = await import("@/app/api/admin/webhooks/events/link/route");
const { GET: notImportedIds } =
  await import("@/app/api/admin/webhooks/events/not-imported-ids/route");
const { POST: applyDiff } = await import("@/app/api/admin/webhooks/events/[eventId]/apply/route");
const { GET: eventDiff } = await import("@/app/api/admin/webhooks/events/[eventId]/diff/route");
const registrations = await import("@/app/api/admin/webhooks/registrations/route");
const { DELETE: deleteRegistration } =
  await import("@/app/api/admin/webhooks/registrations/[id]/route");
const { GET: entityDetail } = await import("@/app/api/admin/translations/entity-detail/route");
const { GET: missing } = await import("@/app/api/admin/translations/missing/route");
const { POST: refreshStats } = await import("@/app/api/admin/translations/refresh-stats/route");
const { PUT: save } = await import("@/app/api/admin/translations/save/route");
const { GET: stats } = await import("@/app/api/admin/translations/stats/route");
const { POST: translate } = await import("@/app/api/admin/translations/translate/route");
const { POST: translateBatch } = await import("@/app/api/admin/translations/translate-batch/route");

const ENTITY_ID = "11111111-1111-4111-8111-111111111111";

function req(path: string, method = "GET", body?: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const eventParams = { params: Promise.resolve({ eventId: "e1" }) };
const idParams = { params: Promise.resolve({ id: "w1" }) };

const handlers: Array<[string, () => Promise<Response>]> = [
  ["webhooks/events GET", () => listEvents(req("/api/admin/webhooks/events"))],
  ["webhooks/events/link POST", () => linkEvents(req("/x", "POST", {}))],
  ["webhooks/events/not-imported-ids GET", () => notImportedIds(req("/x"))],
  ["webhooks/events/[eventId]/apply POST", () => applyDiff(req("/x", "POST", {}), eventParams)],
  ["webhooks/events/[eventId]/diff GET", () => eventDiff(req("/x"), eventParams)],
  ["webhooks/registrations GET", () => registrations.GET(req("/x"))],
  ["webhooks/registrations POST", () => registrations.POST(req("/x", "POST", {}))],
  ["webhooks/registrations/[id] DELETE", () => deleteRegistration(req("/x", "DELETE"), idParams)],
  ["translations/entity-detail GET", () => entityDetail(req("/x"))],
  ["translations/missing GET", () => missing(req("/x"))],
  ["translations/refresh-stats POST", () => refreshStats(req("/x", "POST"))],
  ["translations/save PUT", () => save(req("/x", "PUT", {}))],
  ["translations/stats GET", () => stats(req("/x"))],
  ["translations/translate POST", () => translate(req("/x", "POST", {}))],
  ["translations/translate-batch POST", () => translateBatch(req("/x", "POST", {}))],
];

beforeEach(() => {
  db.reset();
  mockRpc.mockReset().mockResolvedValue({ error: null });
  mockTranslateFields.mockReset();
  mockGetSourceText.mockReset();
  mockUpsertTranslation.mockReset();
});

describe("admin webhook and translation routes auth", () => {
  it.each(handlers)("%s returns 401 for anonymous callers", async (_name, call) => {
    routeEnv.signOut();
    const res = await call();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Authentication required", code: "unauthorized" });
    expect(db.calls).toHaveLength(0);
  });

  it.each(handlers)("%s returns 403 for a self-declared admin", async (_name, call) => {
    routeEnv.signIn(testUser("user", { user_metadata: { role: "admin" } }));
    const res = await call();
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Admin access required", code: "forbidden" });
    expect(db.calls).toHaveLength(0);
  });
});

describe("admin webhook routes", () => {
  it("rejects a link request without igdbId and gameId", async () => {
    const res = await linkEvents(req("/x", "POST", { igdbId: 12 }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "igdbId and gameId required", code: "validation" });
  });

  it("links webhook events to a local game", async () => {
    const res = await linkEvents(req("/x", "POST", { igdbId: 12, gameId: "g1" }));
    expect(res.status).toBe(200);
    expect(db.callsFor("igdb_webhook_events", "update")).toEqual([[{ game_id: "g1" }]]);
  });

  it("rejects an unknown webhook endpoint", async () => {
    const res = await registrations.POST(req("/x", "POST", { endpoint: "nope", method: "create" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid endpoint", code: "validation" });
  });

  it("returns 404 when the diffed event does not exist", async () => {
    db.enqueue("igdb_webhook_events", { data: null, error: { message: "missing" } });
    const res = await eventDiff(req("/x"), eventParams);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Event not found", code: "not_found" });
  });

  it("refuses to diff a non-update event", async () => {
    db.enqueue("igdb_webhook_events", { data: { id: "e1", event_type: "create" } });
    const res = await eventDiff(req("/x"), eventParams);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Diff is only available for update events");
  });

  it("returns 400 for an apply body with a non-array forceFields", async () => {
    const res = await applyDiff(req("/x", "POST", { forceFields: "name" }), eventParams);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid request body");
  });
});

describe("admin translation routes", () => {
  it("validates the entity-detail query", async () => {
    const res = await entityDetail(req("/x?type=games&entityId=not-a-uuid"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid query parameters");
  });

  it("returns 404 when the entity detail is missing", async () => {
    const res = await entityDetail(req(`/x?type=games&entityId=${ENTITY_ID}`));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Entity not found", code: "not_found" });
  });

  it("paginates missing translations", async () => {
    const res = await missing(req("/x?type=games&page=2&limit=10"));
    expect(res.status).toBe(200);
    expect((await res.json()).pagination).toMatchObject({ currentPage: 2, limit: 10 });
  });

  it("maps stats cache rows", async () => {
    db.enqueue("translation_stats_cache", {
      data: [{ entity_type: "games", language_code: "en", total: 2, percentage: 50 }],
    });
    const res = await stats(req("/x"));
    expect((await res.json()).stats[0]).toMatchObject({ entityType: "games", language: "en" });
  });

  it("returns 500 when the stats refresh fails", async () => {
    mockRpc.mockResolvedValue({ error: { message: "boom" } });
    const res = await refreshStats(req("/x", "POST"));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to refresh stats" });
  });

  it("rejects an invalid translate body", async () => {
    const res = await translate(req("/x", "POST", { entityType: "games" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid request body");
  });

  it("returns 400 when no source translation exists", async () => {
    db.enqueue("games", { data: { id: ENTITY_ID } });
    mockGetSourceText.mockResolvedValue(null);
    const res = await translate(
      req("/x", "POST", { entityType: "games", entityId: ENTITY_ID, targetLang: "fr" })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("No source translation available");
  });

  it("returns 504 when the AI translation times out", async () => {
    db.enqueue("games", { data: { id: ENTITY_ID } });
    mockGetSourceText.mockResolvedValue({ sourceLang: "en", fields: { title: "x" } });
    mockTranslateFields.mockRejectedValue(new Error("Request timed out"));
    const res = await translate(
      req("/x", "POST", { entityType: "games", entityId: ENTITY_ID, targetLang: "fr" })
    );
    expect(res.status).toBe(504);
    expect(await res.json()).toEqual({ error: "Translation timed out after 60s" });
  });

  it("translates with the model chosen in the admin", async () => {
    db.enqueue("games", { data: { id: ENTITY_ID } });
    mockGetSourceText.mockResolvedValue({ sourceLang: "en", fields: { title: "x" } });
    mockTranslateFields.mockResolvedValue({ title: "y" });
    const res = await translate(
      req("/x", "POST", {
        entityType: "games",
        entityId: ENTITY_ID,
        targetLang: "fr",
        saveToDb: false,
      })
    );
    expect(res.status).toBe(200);
    expect(mockTranslateFields).toHaveBeenCalledWith(
      expect.objectContaining({ model: "anthropic/claude-haiku-4.5" })
    );
  });

  it("returns 404 when saving a translation of an unknown entity", async () => {
    db.enqueue("games", { data: null, error: { message: "missing" } });
    const res = await save(
      req("/x", "PUT", {
        entityType: "games",
        entityId: ENTITY_ID,
        targetLang: "fr",
        translations: { title: "x" },
      })
    );
    expect(res.status).toBe(404);
    expect(mockUpsertTranslation).not.toHaveBeenCalled();
  });

  it("streams batch translation progress as NDJSON", async () => {
    db.enqueue("games", { data: null, error: { message: "missing" } });
    const res = await translateBatch(
      req("/x", "POST", { entityType: "games", entityIds: [ENTITY_ID], targetLang: "fr" })
    );
    expect(res.headers.get("Content-Type")).toBe("application/x-ndjson");
    expect(JSON.parse((await res.text()).trim())).toEqual({
      entityId: ENTITY_ID,
      status: "error",
      error: "Entity not found",
    });
  });
});
