import type { PlatformConnectionAdapter } from "@/types/platform-connection";
import { PlatformConnectionError } from "../errors";
import { getBearerJson } from "../http";

const AUTHORIZE_URL = "https://itch.io/user/oauth";
const ME_URL = "https://itch.io/api/1/key/me";

interface ItchUser {
  username: string;
  id: number;
  cover_url?: string | null;
}

export const itchConnection: PlatformConnectionAdapter = {
  provider: "itch",
  platform: "itch",
  authType: "oauth",
  grantField: "access_token",
  usesState: true,
  defaultExpiresIn: null,

  async buildAuthorizeUrl({ state, redirectUri }) {
    const params = new URLSearchParams({
      client_id: process.env.ITCH_CLIENT_ID!,
      response_type: "token",
      redirect_uri: redirectUri,
      scope: "profile:me",
      state,
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  },

  async obtainCredentials(accessToken) {
    return { accessToken, refreshToken: null, expiresIn: null };
  },

  async readProfile({ accessToken }) {
    const data = accessToken ? await getBearerJson<{ user?: ItchUser }>(ME_URL, accessToken) : null;
    const user = data?.user;
    if (!user) throw new PlatformConnectionError("profile_failed");
    return {
      externalId: String(user.id),
      username: user.username,
      avatarUrl: user.cover_url ?? null,
    };
  },
};
