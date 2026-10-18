import type { PlatformConnectionAdapter, PlatformCredentials } from "@/types/platform-connection";
import { logger } from "@/lib/logger";
import {
  basicAuthorization,
  credentialsFromTokenResponse,
  getBearerJson,
  postForm,
  type JsonResult,
  type OauthTokenResponse,
} from "../http";

const AUTHORIZE_URL = "https://www.epicgames.com/id/authorize";
const TOKEN_URL = "https://api.epicgames.dev/epic/oauth/v2/token";
const USERINFO_URL = "https://api.epicgames.dev/epic/oauth/v2/userInfo";

interface EpicTokenResponse extends OauthTokenResponse {
  account_id?: string;
  errorCode?: string;
  errorMessage?: string;
  message?: string;
}

interface EpicUserInfo {
  sub?: string;
  preferred_username?: string;
  display_name?: string;
}

function normalizeEpicTokenResponse(data: EpicTokenResponse): EpicTokenResponse {
  return {
    ...data,
    error: data.error ?? data.errorCode,
    error_description: data.error_description ?? data.errorMessage ?? data.message,
  };
}

async function requestEpicToken(body: Record<string, string>): Promise<PlatformCredentials> {
  const result = await postForm<EpicTokenResponse>(TOKEN_URL, body, {
    Authorization: basicAuthorization(process.env.EPIC_CLIENT_ID, process.env.EPIC_CLIENT_SECRET),
  });
  const normalized: JsonResult<EpicTokenResponse> = {
    ...result,
    data: normalizeEpicTokenResponse(result.data),
  };
  if (!normalized.ok || !normalized.data.access_token) {
    logger.error("Epic token request failed", {
      status: normalized.status,
      grantType: body.grant_type,
      error: normalized.data.error,
      errorDescription: normalized.data.error_description,
    });
  }
  return {
    ...credentialsFromTokenResponse(normalized),
    accountId: normalized.data.account_id ?? null,
  };
}

export const epicConnection: PlatformConnectionAdapter = {
  provider: "epic",
  platform: "epic",
  authType: "oauth",
  grantField: "code",
  usesState: true,
  defaultExpiresIn: 7200,

  async buildAuthorizeUrl({ state, redirectUri }) {
    const params = new URLSearchParams({
      client_id: process.env.EPIC_CLIENT_ID!,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: "basic_profile",
      state,
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  },

  obtainCredentials(code, { redirectUri }) {
    return requestEpicToken({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    });
  },

  async readProfile(credentials) {
    const userInfo = credentials.accessToken
      ? await getBearerJson<EpicUserInfo>(USERINFO_URL, credentials.accessToken)
      : null;
    return {
      externalId: credentials.accountId ?? null,
      username: userInfo?.display_name ?? userInfo?.preferred_username ?? null,
    };
  },

  refresh(refreshToken) {
    return requestEpicToken({ grant_type: "refresh_token", refresh_token: refreshToken });
  },
};
