import type { XboxAuthContext } from "@/types/platform-connection";

interface XboxTokenResponse {
  Token: string;
  DisplayClaims: { xui: Array<{ uhs: string; xid?: string }> };
}

async function postXboxJson(url: string, body: unknown, label: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Xbox ${label} failed (${res.status})`);
  return (await res.json()) as XboxTokenResponse;
}

function getUserToken(microsoftAccessToken: string) {
  return postXboxJson(
    "https://user.auth.xboxlive.com/user/authenticate",
    {
      Properties: {
        AuthMethod: "RPS",
        SiteName: "user.auth.xboxlive.com",
        RpsTicket: `d=${microsoftAccessToken}`,
      },
      RelyingParty: "http://auth.xboxlive.com",
      TokenType: "JWT",
    },
    "user token"
  );
}

function getXstsToken(userToken: string) {
  return postXboxJson(
    "https://xsts.auth.xboxlive.com/xsts/authorize",
    {
      Properties: { SandboxId: "RETAIL", UserTokens: [userToken] },
      RelyingParty: "http://xboxlive.com",
      TokenType: "JWT",
    },
    "XSTS token"
  );
}

export async function authorizeXboxLive(
  microsoftAccessToken: string
): Promise<XboxAuthContext | null> {
  const userToken = await getUserToken(microsoftAccessToken);
  const xsts = await getXstsToken(userToken.Token);
  const claims = xsts.DisplayClaims?.xui?.[0];
  if (!xsts.Token || !claims?.uhs || !claims.xid) return null;
  return { xstsToken: xsts.Token, userHash: claims.uhs, xuid: claims.xid };
}

export function xboxAuthorizationHeader(auth: XboxAuthContext): string {
  return `XBL3.0 x=${auth.userHash};${auth.xstsToken}`;
}
