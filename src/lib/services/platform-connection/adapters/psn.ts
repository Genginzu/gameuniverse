import {
  exchangeAccessCodeForAuthTokens,
  exchangeNpssoForAccessCode,
  exchangeRefreshTokenForAuthTokens,
  getProfileFromAccountId,
} from "psn-api";
import type { PlatformConnectionAdapter } from "@/types/platform-connection";
import { PlatformConnectionError } from "../errors";

export function decodeJwtSub(token: string): string | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
    return (JSON.parse(payload) as { sub?: string }).sub ?? null;
  } catch {
    return null;
  }
}

export const psnConnection: PlatformConnectionAdapter = {
  provider: "psn",
  platform: "playstation",
  authType: "npsso",
  grantField: "npsso",
  usesState: false,
  defaultExpiresIn: 3600,

  async obtainCredentials(npsso) {
    const accessCode = await exchangeNpssoForAccessCode(npsso);
    const authorization = await exchangeAccessCodeForAuthTokens(accessCode);
    const accountId = decodeJwtSub(authorization.idToken);
    if (!accountId) {
      throw new PlatformConnectionError("token_failed", "Failed to resolve PSN account id");
    }
    return {
      accessToken: authorization.accessToken,
      refreshToken: authorization.refreshToken ?? null,
      expiresIn: authorization.expiresIn ?? null,
      accountId,
    };
  },

  async readProfile({ accessToken, accountId }) {
    if (!accessToken || !accountId) throw new PlatformConnectionError("profile_failed");
    const profile = await getProfileFromAccountId({ accessToken }, accountId);
    return { externalId: accountId, username: profile.onlineId };
  },

  async refresh(refreshToken) {
    const authorization = await exchangeRefreshTokenForAuthTokens(refreshToken);
    return {
      accessToken: authorization.accessToken,
      refreshToken: authorization.refreshToken ?? null,
      expiresIn: authorization.expiresIn ?? null,
    };
  },
};
