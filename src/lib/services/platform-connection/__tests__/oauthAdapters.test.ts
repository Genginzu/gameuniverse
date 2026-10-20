import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const cookieJar = vi.hoisted(() => new Map<string, string>());

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined),
    set: ({ name, value }: { name: string; value: string }) => cookieJar.set(name, value),
    delete: (name: string) => cookieJar.delete(name),
  }),
}));

import {
  battlenetConnection,
  discordConnection,
  epicConnection,
  xboxConnection,
} from "@/lib/services/platform-connection";

const fetchMock = vi.fn();
const input = {
  fields: new URLSearchParams(),
  redirectUri: "https://app.test/api/auth/x/callback",
};
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function requestBody(call: number): URLSearchParams {
  return new URLSearchParams(String(fetchMock.mock.calls[call][1].body));
}

function requestHeader(call: number, name: string): string | undefined {
  return fetchMock.mock.calls[call][1].headers[name];
}

beforeEach(() => {
  cookieJar.clear();
  vi.stubGlobal("fetch", fetchMock);
  Object.assign(process.env, {
    XBOX_CLIENT_ID: "xbox-id",
    XBOX_CLIENT_SECRET: "xbox-secret",
    EPIC_CLIENT_ID: "epic-id",
    EPIC_CLIENT_SECRET: "epic-secret",
    DISCORD_CLIENT_ID: "discord-id",
    DISCORD_CLIENT_SECRET: "discord-secret",
    BATTLENET_CLIENT_ID: "bnet-id",
    BATTLENET_CLIENT_SECRET: "bnet-secret",
  });
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("xbox connection adapter", () => {
  it("exchanges the code at login.live.com", async () => {
    fetchMock.mockResolvedValue(
      respond({ access_token: "ms", refresh_token: "r", expires_in: 10 })
    );
    const credentials = await xboxConnection.obtainCredentials("code-1", input);

    expect(fetchMock.mock.calls[0][0]).toBe("https://login.live.com/oauth20_token.srf");
    expect(requestBody(0).get("grant_type")).toBe("authorization_code");
    expect(requestBody(0).get("redirect_uri")).toBe(input.redirectUri);
    expect(credentials).toEqual({ accessToken: "ms", refreshToken: "r", expiresIn: 10 });
  });

  it("reads the profile through the XSTS chain", async () => {
    fetchMock
      .mockResolvedValueOnce(respond({ Token: "user", DisplayClaims: { xui: [{ uhs: "h" }] } }))
      .mockResolvedValueOnce(
        respond({ Token: "xsts", DisplayClaims: { xui: [{ uhs: "h", xid: "42" }] } })
      )
      .mockResolvedValueOnce(
        respond({
          profileUsers: [
            {
              settings: [
                { id: "Gamertag", value: "Chief" },
                { id: "GameDisplayPicRaw", value: "https://pic" },
                { id: "Gamerscore", value: "1000" },
              ],
            },
          ],
        })
      );

    const profile = await xboxConnection.readProfile(
      { accessToken: "ms", refreshToken: null, expiresIn: null },
      input
    );

    expect(requestHeader(2, "Authorization")).toBe("XBL3.0 x=h;xsts");
    expect(profile).toEqual({
      externalId: "42",
      username: "Chief",
      avatarUrl: "https://pic",
      metadata: { gamerscore: "1000", account_tier: null },
    });
  });

  it("still links the account when Xbox Live authorization fails", async () => {
    fetchMock.mockResolvedValue(respond({}, 401));
    const profile = await xboxConnection.readProfile(
      { accessToken: "ms", refreshToken: null, expiresIn: null },
      input
    );
    expect(profile).toEqual({ externalId: null, username: null, avatarUrl: null, metadata: null });
  });

  it("refreshes with the refresh_token grant", async () => {
    fetchMock.mockResolvedValue(respond({ access_token: "new" }));
    const credentials = await xboxConnection.refresh!("old");
    expect(requestBody(0).get("grant_type")).toBe("refresh_token");
    expect(requestBody(0).get("refresh_token")).toBe("old");
    expect(credentials.accessToken).toBe("new");
  });
});

describe("epic connection adapter", () => {
  it("exchanges the code with basic auth and keeps the account id", async () => {
    fetchMock.mockResolvedValue(respond({ access_token: "a", account_id: "acct", expires_in: 50 }));
    const credentials = await epicConnection.obtainCredentials("code-1", input);

    const expectedAuth = `Basic ${Buffer.from("epic-id:epic-secret").toString("base64")}`;
    expect(requestHeader(0, "Authorization")).toBe(expectedAuth);
    expect(credentials).toMatchObject({ accessToken: "a", accountId: "acct", expiresIn: 50 });
  });

  it("normalises Epic error shapes into the failure detail", async () => {
    fetchMock.mockResolvedValue(
      respond({ errorCode: "errors.invalid_client", errorMessage: "Bad client" }, 400)
    );
    await expect(epicConnection.obtainCredentials("code-1", input)).rejects.toMatchObject({
      reason: "token_failed",
      detail: "errors.invalid_client: Bad client",
    });
  });

  it("reads the display name from userInfo", async () => {
    fetchMock.mockResolvedValue(respond({ preferred_username: "pref", display_name: "Display" }));
    const profile = await epicConnection.readProfile(
      { accessToken: "a", refreshToken: null, expiresIn: null, accountId: "acct" },
      input
    );
    expect(profile).toEqual({ externalId: "acct", username: "Display" });
  });

  it("refreshes with the refresh_token grant", async () => {
    fetchMock.mockResolvedValue(respond({ access_token: "new", refresh_token: "r2" }));
    const credentials = await epicConnection.refresh!("old");
    expect(requestBody(0).get("grant_type")).toBe("refresh_token");
    expect(credentials).toMatchObject({ accessToken: "new", refreshToken: "r2" });
  });
});

describe("discord connection adapter", () => {
  it("exchanges the code with client credentials", async () => {
    fetchMock.mockResolvedValue(respond({ access_token: "a", refresh_token: "r" }));
    await discordConnection.obtainCredentials("code-1", input);
    expect(requestBody(0).get("client_secret")).toBe("discord-secret");
    expect(requestBody(0).get("code")).toBe("code-1");
  });

  it("normalises the user, avatar and connections", async () => {
    fetchMock
      .mockResolvedValueOnce(
        respond({ id: "1", username: "user", global_name: "Global", avatar: "a_hash" })
      )
      .mockResolvedValueOnce(respond([{ type: "steam", id: "765", name: "Gaben" }]));

    const profile = await discordConnection.readProfile(
      { accessToken: "a", refreshToken: null, expiresIn: null },
      input
    );

    expect(profile).toEqual({
      externalId: "1",
      username: "Global",
      avatarUrl: "https://cdn.discordapp.com/avatars/1/a_hash.gif",
      metadata: { connections: [{ type: "steam", id: "765", name: "Gaben" }] },
    });
  });

  it("fails the profile step when the user lookup fails", async () => {
    fetchMock.mockResolvedValue(respond({}, 401));
    await expect(
      discordConnection.readProfile(
        { accessToken: "a", refreshToken: null, expiresIn: null },
        input
      )
    ).rejects.toMatchObject({ reason: "profile_failed" });
  });

  it("refreshes with the refresh_token grant", async () => {
    fetchMock.mockResolvedValue(respond({ access_token: "new" }));
    await discordConnection.refresh!("old");
    expect(requestBody(0).get("grant_type")).toBe("refresh_token");
  });
});

describe("battlenet connection adapter", () => {
  it("stores the requested region when building the authorize URL", async () => {
    const url = await battlenetConnection.buildAuthorizeUrl!({
      state: "s",
      redirectUri: input.redirectUri,
      baseUrl: "https://app.test",
      query: new URLSearchParams("region=KR"),
    });
    expect(url).toContain("https://oauth.battle.net/authorize?");
    expect(cookieJar.get("oauth_region_battlenet")).toBe("kr");
  });

  it("drops the refresh token and reads the BattleTag + region", async () => {
    cookieJar.set("oauth_region_battlenet", "us");
    fetchMock
      .mockResolvedValueOnce(respond({ access_token: "a", refresh_token: "ignored" }))
      .mockResolvedValueOnce(respond({ sub: "99", battletag: "Hero#1234" }));

    const credentials = await battlenetConnection.obtainCredentials("code-1", input);
    const profile = await battlenetConnection.readProfile(credentials, input);

    expect(credentials.refreshToken).toBeNull();
    expect(profile).toEqual({ externalId: "99", username: "Hero#1234", region: "us" });
    expect(cookieJar.has("oauth_region_battlenet")).toBe(false);
  });

  it("fails the profile step without a subject", async () => {
    fetchMock.mockResolvedValue(respond({}, 500));
    await expect(
      battlenetConnection.readProfile(
        { accessToken: "a", refreshToken: null, expiresIn: null },
        input
      )
    ).rejects.toMatchObject({ reason: "profile_failed" });
  });
});
