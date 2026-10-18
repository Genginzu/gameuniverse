import type { PlatformCredentials } from "@/types/platform-connection";
import { PlatformConnectionError } from "./errors";

export interface OauthTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

export interface JsonResult<T> {
  ok: boolean;
  status: number;
  data: T;
}

export function credentialsFromTokenResponse(
  result: JsonResult<OauthTokenResponse>
): PlatformCredentials {
  const { access_token, refresh_token, expires_in, error, error_description } = result.data;
  if (!result.ok || !access_token) {
    const detail = [error, error_description].filter(Boolean).join(": ");
    throw new PlatformConnectionError(
      "token_failed",
      detail || undefined,
      `Token request failed (${result.status})${detail ? `: ${detail}` : ""}`
    );
  }
  return {
    accessToken: access_token,
    refreshToken: refresh_token ?? null,
    expiresIn: expires_in ?? null,
  };
}

export function basicAuthorization(clientId: string | undefined, secret: string | undefined) {
  return `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`;
}

export async function postForm<T>(
  url: string,
  body: Record<string, string>,
  headers: Record<string, string> = {}
): Promise<JsonResult<T>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", ...headers },
    body: new URLSearchParams(body),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: parseJson<T>(text) };
}

export async function getBearerJson<T>(url: string, accessToken: string): Promise<T | null> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

function parseJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}
