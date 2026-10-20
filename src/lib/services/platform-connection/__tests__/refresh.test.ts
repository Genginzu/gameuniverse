import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getValidAccessToken, getXboxAuthForPlayer } from "@/lib/services/platform-connection";
import { decryptPlatformToken, encryptPlatformToken } from "@/lib/services/platformTokens";

const fetchMock = vi.fn();
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const HOUR_MS = 3600 * 1000;

interface StoredRow {
  id: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
}

function fakeDb(row: StoredRow | null) {
  const updates: Array<Record<string, unknown>> = [];
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: row, error: null }) }) }),
      }),
      update: (patch: Record<string, unknown>) => ({
        eq: async () => {
          updates.push(patch);
          return { error: null };
        },
      }),
    }),
  } as unknown as SupabaseClient<Database>;
  return { client, updates };
}

function storedRow(expiresInMs: number, refresh: string | null = "refresh-1"): StoredRow {
  return {
    id: "row-1",
    access_token: encryptPlatformToken("access-1"),
    refresh_token: refresh ? encryptPlatformToken(refresh) : null,
    token_expires_at: new Date(Date.now() + expiresInMs).toISOString(),
  };
}

beforeEach(() => {
  process.env.PLATFORM_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 3).toString("base64");
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("getValidAccessToken", () => {
  it("returns the decrypted token while it is still valid", async () => {
    const { client } = fakeDb(storedRow(HOUR_MS));
    expect(await getValidAccessToken(client, "p1", "discord")).toBe("access-1");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null when the platform is not linked", async () => {
    const { client } = fakeDb(null);
    expect(await getValidAccessToken(client, "p1", "xbox")).toBeNull();
  });

  it("refreshes an expired token through the platform adapter and persists it", async () => {
    fetchMock.mockResolvedValue(respond({ access_token: "access-2", refresh_token: "refresh-2" }));
    const { client, updates } = fakeDb(storedRow(-HOUR_MS));
    const before = Date.now();

    expect(await getValidAccessToken(client, "p1", "discord")).toBe("access-2");

    expect(fetchMock.mock.calls[0][0]).toBe("https://discord.com/api/oauth2/token");
    const [patch] = updates;
    expect(decryptPlatformToken(patch.access_token as string)).toBe("access-2");
    expect(decryptPlatformToken(patch.refresh_token as string)).toBe("refresh-2");
    const expiresAt = new Date(patch.token_expires_at as string).getTime();
    expect(expiresAt).toBeGreaterThanOrEqual(before + 604800 * 1000);
  });

  it("keeps the stored refresh token when the provider does not rotate it", async () => {
    fetchMock.mockResolvedValue(respond({ access_token: "access-2", expires_in: 60 }));
    const row = storedRow(-HOUR_MS);
    const { client, updates } = fakeDb(row);

    await getValidAccessToken(client, "p1", "epic");

    expect(updates[0].refresh_token).toBe(row.refresh_token);
  });

  it("returns null for platforms without a refresh adapter", async () => {
    const { client } = fakeDb(storedRow(-HOUR_MS));
    expect(await getValidAccessToken(client, "p1", "battlenet")).toBeNull();
    expect(await getValidAccessToken(client, "p1", "gog")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null when the refresh request fails", async () => {
    fetchMock.mockResolvedValue(respond({ error: "invalid_grant" }, 400));
    const { client, updates } = fakeDb(storedRow(-HOUR_MS));
    expect(await getValidAccessToken(client, "p1", "xbox")).toBeNull();
    expect(updates).toHaveLength(0);
  });
});

describe("getXboxAuthForPlayer", () => {
  it("runs the XSTS chain with the stored Microsoft token", async () => {
    fetchMock
      .mockResolvedValueOnce(respond({ Token: "user", DisplayClaims: { xui: [{ uhs: "h" }] } }))
      .mockResolvedValueOnce(
        respond({ Token: "xsts", DisplayClaims: { xui: [{ uhs: "h", xid: "42" }] } })
      );
    const { client } = fakeDb(storedRow(HOUR_MS));

    expect(await getXboxAuthForPlayer(client, "p1")).toEqual({
      xstsToken: "xsts",
      userHash: "h",
      xuid: "42",
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).Properties.RpsTicket).toBe("d=access-1");
  });

  it("returns null when Xbox is not linked", async () => {
    const { client } = fakeDb(null);
    expect(await getXboxAuthForPlayer(client, "p1")).toBeNull();
  });
});
