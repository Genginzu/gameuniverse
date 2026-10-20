import type { PlatformConnectionAdapter, XboxAuthContext } from "@/types/platform-connection";
import { logger } from "@/lib/logger";
import { credentialsFromTokenResponse, postForm, type OauthTokenResponse } from "../http";
import { authorizeXboxLive, xboxAuthorizationHeader } from "../xboxLive";

const AUTHORIZE_URL = "https://login.live.com/oauth20_authorize.srf";
const TOKEN_URL = "https://login.live.com/oauth20_token.srf";
const SCOPE = "XboxLive.signin XboxLive.offline_access";
const PROFILE_SETTINGS = "Gamertag,GameDisplayPicRaw,Gamerscore,AccountTier,PublicGamerpic";

type XboxSetting = { id: string; value: string };

interface XboxProfileResponse {
  profileUsers?: Array<{ settings?: XboxSetting[] }>;
}

function clientCredentials() {
  return {
    client_id: process.env.XBOX_CLIENT_ID!,
    client_secret: process.env.XBOX_CLIENT_SECRET!,
  };
}

function pickSetting(settings: XboxSetting[] | undefined, id: string): string | null {
  return settings?.find((setting) => setting.id === id)?.value ?? null;
}

async function fetchProfileSettings(auth: XboxAuthContext): Promise<XboxSetting[] | undefined> {
  const res = await fetch(
    `https://profile.xboxlive.com/users/me/profile/settings?settings=${PROFILE_SETTINGS}`,
    {
      headers: {
        Authorization: xboxAuthorizationHeader(auth),
        "x-xbl-contract-version": "2",
      },
    }
  );
  if (!res.ok) return undefined;
  const data = (await res.json()) as XboxProfileResponse;
  return data.profileUsers?.[0]?.settings;
}

async function tryAuthorizeXboxLive(accessToken: string): Promise<XboxAuthContext | null> {
  try {
    return await authorizeXboxLive(accessToken);
  } catch (error) {
    logger.warn("Xbox Live authorization failed during connect", { error });
    return null;
  }
}

export const xboxConnection: PlatformConnectionAdapter = {
  provider: "xbox",
  platform: "xbox",
  authType: "oauth",
  grantField: "code",
  usesState: true,
  defaultExpiresIn: 3600,

  async buildAuthorizeUrl({ state, redirectUri }) {
    const params = new URLSearchParams({
      client_id: process.env.XBOX_CLIENT_ID!,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: SCOPE,
      state,
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  },

  async obtainCredentials(code, { redirectUri }) {
    const result = await postForm<OauthTokenResponse>(TOKEN_URL, {
      ...clientCredentials(),
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });
    return credentialsFromTokenResponse(result);
  },

  async readProfile(credentials) {
    const auth = credentials.accessToken
      ? await tryAuthorizeXboxLive(credentials.accessToken)
      : null;
    if (!auth) return { externalId: null, username: null, avatarUrl: null, metadata: null };
    const settings = await fetchProfileSettings(auth);
    return {
      externalId: auth.xuid,
      username: pickSetting(settings, "Gamertag"),
      avatarUrl: pickSetting(settings, "GameDisplayPicRaw"),
      metadata: {
        gamerscore: pickSetting(settings, "Gamerscore"),
        account_tier: pickSetting(settings, "AccountTier"),
      },
    };
  },

  async refresh(refreshToken) {
    const result = await postForm<OauthTokenResponse>(TOKEN_URL, {
      ...clientCredentials(),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      scope: SCOPE,
    });
    return credentialsFromTokenResponse(result);
  },
};
