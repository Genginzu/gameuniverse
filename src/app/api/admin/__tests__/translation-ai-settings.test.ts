/**
 * Admin translation AI settings route, run through the real route pipeline and
 * the real settings service, with mocked Supabase and Vercel AI Gateway.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";
import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";

const db = createSupabaseQueryMock();
const mockGetAvailableModels = vi.fn();
const mockGetCredits = vi.fn();
const routeEnv = useTestRouteEnvironment({ signedInAs: "admin" });

vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: () => db.client }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock("ai", () => ({
  gateway: {
    getAvailableModels: () => mockGetAvailableModels(),
    getCredits: () => mockGetCredits(),
  },
}));

const { GET, PUT } = await import("@/app/api/admin/translations/ai-settings/route");

const MODELS = [
  {
    id: "openai/gpt-5.4-nano",
    name: "GPT-5.4 Nano",
    pricing: { input: "0.00000005", output: "0.0000004" },
    modelType: "language",
  },
  { id: "anthropic/claude-haiku-4.5", name: "Claude Haiku 4.5", modelType: "language" },
  { id: "openai/text-embedding-3-small", name: "Embedding", modelType: "embedding" },
];

function req(method = "GET", body?: unknown) {
  return new NextRequest("http://localhost/api/admin/translations/ai-settings", {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

beforeEach(() => {
  db.reset();
  mockGetAvailableModels.mockReset().mockResolvedValue({ models: MODELS });
  mockGetCredits.mockReset().mockResolvedValue({ balance: "12.5", totalUsed: "3.25" });
});

describe("GET /api/admin/translations/ai-settings", () => {
  it("refuses non-admin callers", async () => {
    routeEnv.signIn(testUser("user", { user_metadata: { role: "admin" } }));
    const res = await GET(req());
    expect(res.status).toBe(403);
    expect(mockGetCredits).not.toHaveBeenCalled();
  });

  it("returns the default model, language models only, and credits", async () => {
    const res = await GET(req());
    const body = await res.json();
    expect(body.model).toBe("openai/gpt-5.4-nano");
    expect(body.models.map((m: { id: string }) => m.id)).toEqual([
      "anthropic/claude-haiku-4.5",
      "openai/gpt-5.4-nano",
    ]);
    expect(body.models[1].inputPricePerMillion).toBeCloseTo(0.05);
    expect(body.models[1].outputPricePerMillion).toBeCloseTo(0.4);
    expect(body.models[0].inputPricePerMillion).toBeNull();
    expect(body.credits).toEqual({ balance: 12.5, totalUsed: 3.25 });
  });

  it("returns the model saved in admin settings", async () => {
    db.enqueue("admin_settings", { data: { value: "anthropic/claude-haiku-4.5" } });
    const body = await (await GET(req())).json();
    expect(body.model).toBe("anthropic/claude-haiku-4.5");
  });

  it("still answers when the gateway is unreachable", async () => {
    mockGetAvailableModels.mockRejectedValue(new Error("no key"));
    mockGetCredits.mockRejectedValue(new Error("no key"));
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ model: "openai/gpt-5.4-nano", models: [], credits: null });
  });
});

describe("PUT /api/admin/translations/ai-settings", () => {
  it("saves a gateway language model", async () => {
    const res = await PUT(req("PUT", { model: "anthropic/claude-haiku-4.5" }));
    expect(res.status).toBe(200);
    const [row, options] = db.callsFor("admin_settings", "upsert")[0] as [
      Record<string, unknown>,
      unknown,
    ];
    expect(row).toMatchObject({ key: "translation_model", value: "anthropic/claude-haiku-4.5" });
    expect(options).toEqual({ onConflict: "key" });
  });

  it("rejects a model unknown to the gateway", async () => {
    const res = await PUT(req("PUT", { model: "openai/text-embedding-3-small" }));
    expect(res.status).toBe(400);
    expect(db.callsFor("admin_settings", "upsert")).toHaveLength(0);
  });

  it("rejects a malformed model id", async () => {
    const res = await PUT(req("PUT", { model: "not a model" }));
    expect(res.status).toBe(400);
  });

  it("does not save when the gateway is unreachable", async () => {
    mockGetAvailableModels.mockRejectedValue(new Error("down"));
    const res = await PUT(req("PUT", { model: "openai/gpt-5.4-nano" }));
    expect(res.status).toBe(502);
    expect(db.callsFor("admin_settings", "upsert")).toHaveLength(0);
  });
});
