import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getValidAccessToken } from "./platformTokenRefresh";

export interface XboxAuthContext {
  xstsToken: string;
  userHash: string;
  xuid: string;
}

async function getUserToken(microsoftAccessToken: string): Promise<{
  Token: string;
  DisplayClaims: { xui: Array<{ uhs: string }> };
}> {
  const res = await fetch("https://user.auth.xboxlive.com/user/authenticate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Properties: {
        AuthMethod: "RPS",
        SiteName: "user.auth.xboxlive.com",
        RpsTicket: `d=${microsoftAccessToken}`,
      },
      RelyingParty: "http://auth.xboxlive.com",
      TokenType: "JWT",
    }),
  });
  if (!res.ok) throw new Error(`Xbox user token failed (${res.status})`);
  return res.json();
}

async function getXstsToken(userToken: string): Promise<{
  Token: string;
  DisplayClaims: { xui: Array<{ uhs: string; xid?: string }> };
}> {
  const res = await fetch("https://xsts.auth.xboxlive.com/xsts/authorize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Properties: { SandboxId: "RETAIL", UserTokens: [userToken] },
      RelyingParty: "http://xboxlive.com",
      TokenType: "JWT",
    }),
  });
  if (!res.ok) throw new Error(`Xbox XSTS token failed (${res.status})`);
  return res.json();
}

/**
 * Return an XSTS token + user hash + XUID suitable for Xbox Live API calls,
 * given a player who has previously linked their Xbox account via OAuth.
 *
 * Refreshes the underlying Microsoft access token if expired.
 * Returns null when the player has not connected Xbox.
 */
export async function getXboxAuthForPlayer(
  supabase: SupabaseClient<Database>,
  playerId: string
): Promise<XboxAuthContext | null> {
  const microsoftAccessToken = await getValidAccessToken(supabase, playerId, "xbox");
  if (!microsoftAccessToken) return null;

  const userTokenResp = await getUserToken(microsoftAccessToken);
  const xstsResp = await getXstsToken(userTokenResp.Token);

  const uhs = xstsResp.DisplayClaims.xui[0]?.uhs;
  const xuid = xstsResp.DisplayClaims.xui[0]?.xid;
  if (!uhs || !xuid) return null;

  return {
    xstsToken: xstsResp.Token,
    userHash: uhs,
    xuid,
  };
}

export function xboxAuthorizationHeader(auth: XboxAuthContext): string {
  return `XBL3.0 x=${auth.userHash};${auth.xstsToken}`;
}
