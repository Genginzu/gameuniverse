import type { PlatformConnectionAdapter } from "@/types/platform-connection";
import { PlatformConnectionError } from "../errors";
import {
  credentialsFromTokenResponse,
  getBearerJson,
  postForm,
  type OauthTokenResponse,
} from "../http";

const AUTHORIZE_URL = "https://discord.com/oauth2/authorize";
const TOKEN_URL = "https://discord.com/api/oauth2/token";
const USER_URL = "https://discord.com/api/users/@me";
const CONNECTIONS_URL = "https://discord.com/api/users/@me/connections";

interface DiscordUser {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
}

type DiscordConnection = {
  type: string;
  id: string;
  name: string;
  verified?: boolean;
};

export function buildDiscordAvatarUrl(user: DiscordUser): string | null {
  if (!user.avatar) return null;
  const ext = user.avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}`;
}

function clientCredentials() {
  return {
    client_id: process.env.DISCORD_CLIENT_ID!,
    client_secret: process.env.DISCORD_CLIENT_SECRET!,
  };
}

export const discordConnection: PlatformConnectionAdapter = {
  provider: "discord",
  platform: "discord",
  authType: "oauth",
  grantField: "code",
  usesState: true,
  defaultExpiresIn: 604800,

  async buildAuthorizeUrl({ state, redirectUri }) {
    const params = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: "identify connections",
      state,
      prompt: "consent",
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  },

  async obtainCredentials(code, { redirectUri }) {
    const result = await postForm<OauthTokenResponse>(TOKEN_URL, {
      ...clientCredentials(),
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    });
    return credentialsFromTokenResponse(result);
  },

  async readProfile({ accessToken }) {
    const user = accessToken ? await getBearerJson<DiscordUser>(USER_URL, accessToken) : null;
    if (!user || !accessToken) throw new PlatformConnectionError("profile_failed");
    const connections =
      (await getBearerJson<DiscordConnection[]>(CONNECTIONS_URL, accessToken)) ?? [];
    return {
      externalId: user.id,
      username: user.global_name ?? user.username,
      avatarUrl: buildDiscordAvatarUrl(user),
      metadata: { connections },
    };
  },

  async refresh(refreshToken) {
    const result = await postForm<OauthTokenResponse>(TOKEN_URL, {
      ...clientCredentials(),
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });
    return credentialsFromTokenResponse(result);
  },
};
