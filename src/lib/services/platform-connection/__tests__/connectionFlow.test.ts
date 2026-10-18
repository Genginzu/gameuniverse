import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { PlatformConnectionAdapter } from "@/types/platform-connection";

const env = vi.hoisted(() => {
  const cookieJar = new Map<string, string>();
  const db = {
    user: { id: "player-1" } as { id: string } | null,
    upsertError: null as { message: string } | null,
    crash: false,
    upserts: [] as Array<{ row: Record<string, unknown>; options: unknown }>,
  };
  return { cookieJar, db };
});

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      env.cookieJar.has(name) ? { name, value: env.cookieJar.get(name) } : undefined,
    set: ({ name, value }: { name: string; value: string }) => env.cookieJar.set(name, value),
    delete: (name: string) => env.cookieJar.delete(name),
  }),
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: async () => {
    if (env.db.crash) throw new Error("supabase unavailable");
    return {
      auth: { getUser: async () => ({ data: { user: env.db.user } }) },
      from: () => ({
        upsert: async (row: Record<string, unknown>, options: unknown) => {
          env.db.upserts.push({ row, options });
          return { error: env.db.upsertError };
        },
      }),
    };
  },
}));

import {
  createAuthorizeHandler,
  createCallbackHandler,
  createImplicitBridgeHandler,
  createImplicitCallbackHandler,
  createNpssoHandler,
  PlatformConnectionError,
} from "@/lib/services/platform-connection";
import { decryptPlatformToken } from "@/lib/services/platformTokens";

const BASE = "http://localhost:3000";

function fakeAdapter(
  overrides: Partial<PlatformConnectionAdapter> = {}
): PlatformConnectionAdapter {
  return {
    provider: "epic",
    platform: "epic",
    authType: "oauth",
    grantField: "code",
    usesState: true,
    defaultExpiresIn: 7200,
    buildAuthorizeUrl: vi.fn(
      async ({ state, redirectUri }) =>
        `https://provider.test/authorize?state=${state}&r=${redirectUri}`
    ),
    obtainCredentials: vi.fn(async () => ({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      expiresIn: null,
    })),
    readProfile: vi.fn(async () => ({ externalId: "ext-1", username: "Player" })),
    ...overrides,
  };
}

async function runCallback(adapter: PlatformConnectionAdapter, query: string): Promise<URL> {
  const response = await createCallbackHandler(adapter)(
    new NextRequest(`${BASE}/api/auth/epic/callback?${query}`)
  );
  return new URL(response.headers.get("location")!);
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_BASE_URL = BASE;
  process.env.PLATFORM_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  env.cookieJar.clear();
  env.cookieJar.set("oauth_state_epic", "good-state");
  env.db.user = { id: "player-1" };
  env.db.upsertError = null;
  env.db.crash = false;
  env.db.upserts = [];
});

describe("platform connection callback flow", () => {
  it("redirects anonymous visitors to the auth page", async () => {
    env.db.user = null;
    const location = await runCallback(fakeAdapter(), "code=c&state=good-state");
    expect(location.toString()).toBe(`${BASE}/auth?error=unauthorized`);
  });

  it("rejects a state mismatch before exchanging the code", async () => {
    const adapter = fakeAdapter();
    const location = await runCallback(adapter, "code=c&state=forged");

    expect(location.pathname).toBe("/players/player-1");
    expect(location.searchParams.get("tab")).toBe("settings");
    expect(location.searchParams.get("error")).toBe("epic_callback_failed");
    expect(location.searchParams.get("reason")).toBe("state_mismatch");
    expect(adapter.obtainCredentials).not.toHaveBeenCalled();
    expect(env.cookieJar.has("oauth_state_epic")).toBe(false);
  });

  it("reports a missing code", async () => {
    const location = await runCallback(fakeAdapter(), "state=good-state");
    expect(location.searchParams.get("reason")).toBe("no_code");
  });

  it("sends errors back to the stored return path and consumes it", async () => {
    env.cookieJar.set("oauth_return_to", "/connections?tab=games");
    const location = await runCallback(fakeAdapter(), "state=forged&code=c");

    expect(location.pathname).toBe("/connections");
    expect(location.searchParams.get("tab")).toBe("games");
    expect(location.searchParams.get("error")).toBe("epic_callback_failed");
    expect(env.cookieJar.has("oauth_return_to")).toBe(false);
  });

  it("turns a failed database write into an error redirect", async () => {
    env.db.upsertError = { message: "permission denied" };
    const location = await runCallback(fakeAdapter(), "code=c&state=good-state");

    expect(location.searchParams.get("error")).toBe("epic_callback_failed");
    expect(location.searchParams.get("reason")).toBe("persist_failed");
    expect(location.searchParams.get("success")).toBeNull();
  });

  it("persists the encrypted row and redirects with success", async () => {
    const before = Date.now();
    const location = await runCallback(fakeAdapter(), "code=c&state=good-state");

    expect(location.toString()).toBe(
      `${BASE}/players/player-1?tab=settings&platform=epic&success=true`
    );
    const [{ row, options }] = env.db.upserts;
    expect(options).toEqual({ onConflict: "player_id,platform" });
    expect(row).toMatchObject({
      player_id: "player-1",
      platform: "epic",
      auth_type: "oauth",
      external_id: "ext-1",
      platform_username: "Player",
    });
    expect(decryptPlatformToken(row.access_token as string)).toBe("access-1");
    expect(decryptPlatformToken(row.refresh_token as string)).toBe("refresh-1");
    const expiresAt = new Date(row.token_expires_at as string).getTime();
    expect(expiresAt).toBeGreaterThanOrEqual(before + 7200 * 1000);
  });

  it("passes adapter reasons and truncated details through", async () => {
    const adapter = fakeAdapter({
      obtainCredentials: vi.fn(async () => {
        throw new PlatformConnectionError("token_failed", `invalid_grant: ${"x".repeat(300)}`);
      }),
    });
    const location = await runCallback(adapter, "code=c&state=good-state");

    expect(location.searchParams.get("reason")).toBe("token_failed");
    expect(location.searchParams.get("detail")).toHaveLength(160);
    expect(env.db.upserts).toHaveLength(0);
  });

  it("classifies unexpected profile errors as profile_failed", async () => {
    const adapter = fakeAdapter({
      readProfile: vi.fn(async () => {
        throw new Error("boom");
      }),
    });
    const location = await runCallback(adapter, "code=c&state=good-state");
    expect(location.searchParams.get("reason")).toBe("profile_failed");
  });

  it("falls back to the home page when the flow crashes", async () => {
    env.db.crash = true;
    const location = await runCallback(fakeAdapter(), "code=c&state=good-state");
    expect(location.toString()).toBe(`${BASE}/?error=epic_callback_failed`);
  });
});

describe("platform connection route handlers", () => {
  it("issues state + return cookies and redirects to the provider", async () => {
    const adapter = fakeAdapter();
    const response = await createAuthorizeHandler(adapter)(
      new NextRequest(`${BASE}/api/auth/epic?returnTo=/connections`)
    );

    const state = env.cookieJar.get("oauth_state_epic");
    expect(state).not.toBe("good-state");
    expect(env.cookieJar.get("oauth_return_to")).toBe("/connections");
    expect(response.headers.get("location")).toBe(
      `https://provider.test/authorize?state=${state}&r=${BASE}/api/auth/epic/callback`
    );
  });

  it("serves the implicit-flow bridge page", async () => {
    const response = await createImplicitBridgeHandler()();
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(await response.text()).toContain("location.hash");
  });

  it("answers the implicit-flow POST with a JSON redirect", async () => {
    const adapter = fakeAdapter({ grantField: "access_token" });
    const response = await createImplicitCallbackHandler(adapter)(
      new NextRequest(`${BASE}/api/auth/epic/callback`, {
        method: "POST",
        body: JSON.stringify({ access_token: "implicit", state: "good-state" }),
      })
    );

    expect(await response.json()).toEqual({
      redirect: `${BASE}/players/player-1?tab=settings&platform=epic&success=true`,
    });
    expect(adapter.obtainCredentials).toHaveBeenCalledWith("implicit", expect.anything());
  });

  it("links an NPSSO platform without state and answers in JSON", async () => {
    const adapter = fakeAdapter({ usesState: false, grantField: "npsso", platform: "playstation" });
    const response = await createNpssoHandler(adapter)(
      new NextRequest(`${BASE}/api/auth/psn`, {
        method: "POST",
        body: JSON.stringify({ npsso: "  token  " }),
      })
    );

    expect(await response.json()).toEqual({
      success: true,
      username: "Player",
      accountId: "ext-1",
    });
    expect(adapter.obtainCredentials).toHaveBeenCalledWith("token", expect.anything());
    expect(env.db.upserts[0].row.platform).toBe("playstation");
  });

  it("maps NPSSO failures to 400 / 401 JSON errors", async () => {
    const adapter = fakeAdapter({ usesState: false, grantField: "npsso" });
    const post = (body: unknown) =>
      createNpssoHandler(adapter)(
        new NextRequest(`${BASE}/api/auth/psn`, { method: "POST", body: JSON.stringify(body) })
      );

    const missing = await post({});
    expect(missing.status).toBe(400);
    expect(await missing.json()).toEqual({ error: "NPSSO token is required" });

    env.db.user = null;
    expect((await post({ npsso: "t" })).status).toBe(401);
  });
});
