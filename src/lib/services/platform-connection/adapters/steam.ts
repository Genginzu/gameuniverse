import type { PlatformConnectionAdapter } from "@/types/platform-connection";
import { PlatformConnectionError } from "../errors";

const OPENID_URL = "https://steamcommunity.com/openid/login";
const OPENID_NS = "http://specs.openid.net/auth/2.0";
const IDENTIFIER_SELECT = "http://specs.openid.net/auth/2.0/identifier_select";
const STEAM_ID_REGEX = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/;

interface SteamPlayerSummary {
  personaname: string;
  avatarfull?: string;
  loccountrycode?: string;
  profileurl?: string;
  timecreated?: number;
}

async function verifyOpenIdAssertion(fields: URLSearchParams): Promise<boolean> {
  const verifyParams = new URLSearchParams(fields);
  verifyParams.set("openid.mode", "check_authentication");
  const res = await fetch(OPENID_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verifyParams.toString(),
  });
  return (await res.text()).includes("is_valid:true");
}

async function fetchPlayerSummary(steamId: string): Promise<SteamPlayerSummary | null> {
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) return null;
  const res = await fetch(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`
  );
  const data = (await res.json()) as { response?: { players?: SteamPlayerSummary[] } };
  return data?.response?.players?.[0] ?? null;
}

export const steamConnection: PlatformConnectionAdapter = {
  provider: "steam",
  platform: "steam",
  authType: "oauth",
  grantField: "openid.claimed_id",
  usesState: true,
  defaultExpiresIn: null,

  async buildAuthorizeUrl({ state, redirectUri, baseUrl }) {
    const params = new URLSearchParams({
      "openid.ns": OPENID_NS,
      "openid.mode": "checkid_setup",
      "openid.return_to": `${redirectUri}?state=${state}`,
      "openid.realm": baseUrl,
      "openid.identity": IDENTIFIER_SELECT,
      "openid.claimed_id": IDENTIFIER_SELECT,
    });
    return `${OPENID_URL}?${params.toString()}`;
  },

  async obtainCredentials(claimedId, { fields }) {
    const steamId = claimedId.match(STEAM_ID_REGEX)?.[1];
    if (!steamId || !(await verifyOpenIdAssertion(fields))) {
      throw new PlatformConnectionError("auth_failed");
    }
    return { accessToken: null, refreshToken: null, expiresIn: null, accountId: steamId };
  },

  async readProfile({ accountId }) {
    const steamId = accountId ?? null;
    const profile = steamId ? await fetchPlayerSummary(steamId) : null;
    return {
      externalId: steamId,
      username: profile?.personaname ?? null,
      avatarUrl: profile?.avatarfull ?? null,
      metadata: profile
        ? {
            country: profile.loccountrycode ?? null,
            profile_url: profile.profileurl ?? null,
            created_at: profile.timecreated ?? null,
          }
        : null,
    };
  },
};
