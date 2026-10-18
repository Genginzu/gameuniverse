import { cookies } from "next/headers";
import type { PlatformConnectionAdapter } from "@/types/platform-connection";
import { PlatformConnectionError } from "../errors";
import {
  basicAuthorization,
  credentialsFromTokenResponse,
  getBearerJson,
  postForm,
  type OauthTokenResponse,
} from "../http";

const AUTHORIZE_URL = "https://oauth.battle.net/authorize";
const TOKEN_URL = "https://oauth.battle.net/token";
const USERINFO_URL = "https://oauth.battle.net/userinfo";
const REGION_COOKIE = "oauth_region_battlenet";
const DEFAULT_REGION = "eu";
const ALLOWED_REGIONS = new Set(["us", "eu", "kr", "tw"]);

interface BattleNetUserInfo {
  sub?: string;
  id?: number;
  battletag?: string;
}

export function resolveBattleNetRegion(requested: string | null | undefined): string {
  const region = requested?.toLowerCase() ?? DEFAULT_REGION;
  return ALLOWED_REGIONS.has(region) ? region : DEFAULT_REGION;
}

async function storeRegion(region: string): Promise<void> {
  const store = await cookies();
  store.set({
    name: REGION_COOKIE,
    value: region,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
}

async function consumeRegion(): Promise<string> {
  const store = await cookies();
  const region = store.get(REGION_COOKIE)?.value ?? DEFAULT_REGION;
  store.delete(REGION_COOKIE);
  return region;
}

export const battlenetConnection: PlatformConnectionAdapter = {
  provider: "battlenet",
  platform: "battlenet",
  authType: "oauth",
  grantField: "code",
  usesState: true,
  defaultExpiresIn: 86400,

  async buildAuthorizeUrl({ state, redirectUri, query }) {
    await storeRegion(resolveBattleNetRegion(query.get("region")));
    const params = new URLSearchParams({
      client_id: process.env.BATTLENET_CLIENT_ID!,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: "openid",
      state,
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  },

  async obtainCredentials(code, { redirectUri }) {
    const result = await postForm<OauthTokenResponse>(
      TOKEN_URL,
      { grant_type: "authorization_code", code, redirect_uri: redirectUri },
      {
        Authorization: basicAuthorization(
          process.env.BATTLENET_CLIENT_ID,
          process.env.BATTLENET_CLIENT_SECRET
        ),
      }
    );
    return { ...credentialsFromTokenResponse(result), refreshToken: null };
  },

  async readProfile(credentials) {
    const region = await consumeRegion();
    const userInfo = credentials.accessToken
      ? await getBearerJson<BattleNetUserInfo>(USERINFO_URL, credentials.accessToken)
      : null;
    if (!userInfo?.sub) throw new PlatformConnectionError("profile_failed");
    return { externalId: userInfo.sub, username: userInfo.battletag ?? null, region };
  },
};
