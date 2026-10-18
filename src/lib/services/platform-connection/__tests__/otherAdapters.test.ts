import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("psn-api", () => ({
  exchangeNpssoForAccessCode: vi.fn(),
  exchangeAccessCodeForAuthTokens: vi.fn(),
  exchangeRefreshTokenForAuthTokens: vi.fn(),
  getProfileFromAccountId: vi.fn(),
}));

import {
  exchangeAccessCodeForAuthTokens,
  exchangeNpssoForAccessCode,
  exchangeRefreshTokenForAuthTokens,
  getProfileFromAccountId,
} from "psn-api";
import { itchConnection, psnConnection, steamConnection } from "@/lib/services/platform-connection";

const fetchMock = vi.fn();
const redirectUri = "https://app.test/api/auth/steam/callback";
const respond = (body: unknown, status = 200) =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
const noTokens = { accessToken: null, refreshToken: null, expiresIn: null };

function jwtWithSub(sub: string): string {
  return `header.${Buffer.from(JSON.stringify({ sub })).toString("base64url")}.signature`;
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  process.env.STEAM_API_KEY = "steam-key";
  process.env.ITCH_CLIENT_ID = "itch-id";
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("steam connection adapter", () => {
  const claimedId = "https://steamcommunity.com/openid/id/76561198000000000";
  const fields = new URLSearchParams({ "openid.claimed_id": claimedId, state: "s" });

  it("embeds the state in the OpenID return_to URL", async () => {
    const url = new URL(
      await steamConnection.buildAuthorizeUrl!({
        state: "s",
        redirectUri,
        baseUrl: "https://app.test",
        query: new URLSearchParams(),
      })
    );
    expect(url.searchParams.get("openid.return_to")).toBe(`${redirectUri}?state=s`);
    expect(url.searchParams.get("openid.realm")).toBe("https://app.test");
  });

  it("verifies the assertion and resolves the steam id", async () => {
    fetchMock.mockResolvedValue(respond("ns:http://specs.openid.net/auth/2.0\nis_valid:true\n"));
    const credentials = await steamConnection.obtainCredentials(claimedId, { fields, redirectUri });

    const body = new URLSearchParams(String(fetchMock.mock.calls[0][1].body));
    expect(body.get("openid.mode")).toBe("check_authentication");
    expect(credentials).toEqual({ ...noTokens, accountId: "76561198000000000" });
  });

  it("rejects an invalid assertion", async () => {
    fetchMock.mockResolvedValue(respond("is_valid:false"));
    await expect(
      steamConnection.obtainCredentials(claimedId, { fields, redirectUri })
    ).rejects.toMatchObject({ reason: "auth_failed" });
  });

  it("normalises the player summary", async () => {
    fetchMock.mockResolvedValue(
      respond({
        response: {
          players: [
            { personaname: "Gaben", avatarfull: "https://a", loccountrycode: "US", timecreated: 1 },
          ],
        },
      })
    );
    const profile = await steamConnection.readProfile(
      { ...noTokens, accountId: "765" },
      { fields, redirectUri }
    );
    expect(String(fetchMock.mock.calls[0][0])).toContain("steamids=765");
    expect(profile).toEqual({
      externalId: "765",
      username: "Gaben",
      avatarUrl: "https://a",
      metadata: { country: "US", profile_url: null, created_at: 1 },
    });
  });
});

describe("itch connection adapter", () => {
  const input = { fields: new URLSearchParams(), redirectUri };

  it("requests the implicit token flow", async () => {
    const url = new URL(
      await itchConnection.buildAuthorizeUrl!({
        state: "s",
        redirectUri,
        baseUrl: "https://app.test",
        query: new URLSearchParams(),
      })
    );
    expect(url.searchParams.get("response_type")).toBe("token");
  });

  it("uses the implicit token as credentials and reads the profile", async () => {
    const credentials = await itchConnection.obtainCredentials("implicit", input);
    fetchMock.mockResolvedValue(respond({ user: { id: 7, username: "maker", cover_url: "c" } }));
    const profile = await itchConnection.readProfile(credentials, input);

    expect(credentials).toEqual({ accessToken: "implicit", refreshToken: null, expiresIn: null });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer implicit");
    expect(profile).toEqual({ externalId: "7", username: "maker", avatarUrl: "c" });
  });

  it("fails the profile step when /key/me fails", async () => {
    fetchMock.mockResolvedValue(respond({}, 401));
    await expect(
      itchConnection.readProfile({ ...noTokens, accessToken: "t" }, input)
    ).rejects.toMatchObject({ reason: "profile_failed" });
  });
});

describe("psn connection adapter", () => {
  const input = { fields: new URLSearchParams(), redirectUri: "" };

  it("exchanges the NPSSO and resolves the account id from the id token", async () => {
    vi.mocked(exchangeNpssoForAccessCode).mockResolvedValue("access-code");
    vi.mocked(exchangeAccessCodeForAuthTokens).mockResolvedValue({
      accessToken: "psn-access",
      refreshToken: "psn-refresh",
      expiresIn: 3599,
      idToken: jwtWithSub("acct-9"),
    } as never);

    const credentials = await psnConnection.obtainCredentials("npsso", input);

    expect(exchangeNpssoForAccessCode).toHaveBeenCalledWith("npsso");
    expect(credentials).toEqual({
      accessToken: "psn-access",
      refreshToken: "psn-refresh",
      expiresIn: 3599,
      accountId: "acct-9",
    });
  });

  it("fails when the id token has no subject", async () => {
    vi.mocked(exchangeNpssoForAccessCode).mockResolvedValue("access-code");
    vi.mocked(exchangeAccessCodeForAuthTokens).mockResolvedValue({
      accessToken: "a",
      idToken: "not-a-jwt",
    } as never);
    await expect(psnConnection.obtainCredentials("npsso", input)).rejects.toMatchObject({
      reason: "token_failed",
      detail: "Failed to resolve PSN account id",
    });
  });

  it("reads the online id for the resolved account", async () => {
    vi.mocked(getProfileFromAccountId).mockResolvedValue({ onlineId: "Kratos" } as never);
    const profile = await psnConnection.readProfile(
      { accessToken: "a", refreshToken: null, expiresIn: null, accountId: "acct-9" },
      input
    );
    expect(getProfileFromAccountId).toHaveBeenCalledWith({ accessToken: "a" }, "acct-9");
    expect(profile).toEqual({ externalId: "acct-9", username: "Kratos" });
  });

  it("refreshes through psn-api", async () => {
    vi.mocked(exchangeRefreshTokenForAuthTokens).mockResolvedValue({
      accessToken: "new",
      refreshToken: "r2",
      expiresIn: 100,
    } as never);
    expect(await psnConnection.refresh!("old")).toEqual({
      accessToken: "new",
      refreshToken: "r2",
      expiresIn: 100,
    });
  });
});
