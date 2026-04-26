import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_PREFIX = "oauth_state_";
const MAX_AGE_SECONDS = 600;

export function generateOauthState(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Issue a short-lived, HttpOnly cookie containing the OAuth state value
 * and return the state string to embed in the authorize URL.
 */
export async function issueOauthState(provider: string): Promise<string> {
  const state = generateOauthState();
  const store = await cookies();
  store.set({
    name: `${COOKIE_PREFIX}${provider}`,
    value: state,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return state;
}

/**
 * Verify the state value from the OAuth callback matches the cookie we issued.
 * Always clears the cookie afterwards.
 */
export async function consumeOauthState(
  provider: string,
  received: string | null
): Promise<boolean> {
  const store = await cookies();
  const cookieName = `${COOKIE_PREFIX}${provider}`;
  const expected = store.get(cookieName)?.value ?? null;
  store.delete(cookieName);
  if (!received || !expected) return false;
  return received === expected;
}
