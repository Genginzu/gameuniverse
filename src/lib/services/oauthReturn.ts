import { cookies } from "next/headers";
import { isSafeRelativePath as isSafeReturnPath } from "@/lib/utils/authLinks";

/**
 * Round-trips a "return to" path through an OAuth connect flow so the user
 * comes back to the page they started from (e.g. the Connections page) instead
 * of a hardcoded profile page.
 *
 * The path is stored in a short-lived HttpOnly cookie when the flow starts and
 * consumed in the callback. Only same-origin relative paths are accepted.
 */

const COOKIE = "oauth_return_to";
const MAX_AGE_SECONDS = 600;

/** Store the return path (no-op when missing or unsafe). */
export async function issueOauthReturn(returnTo: string | null | undefined): Promise<void> {
  if (!isSafeReturnPath(returnTo)) return;
  const store = await cookies();
  store.set({
    name: COOKIE,
    value: returnTo,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Read and clear the stored return path. Returns a safe relative path or null. */
export async function consumeOauthReturn(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(COOKIE)?.value ?? null;
  store.delete(COOKIE);
  return isSafeReturnPath(value) ? value : null;
}

/** Append query params to a relative path, preserving any existing query. */
export function withParams(path: string, params: Record<string, string>): string {
  const [base, existing] = path.split("?");
  const search = new URLSearchParams(existing);
  for (const [key, value] of Object.entries(params)) search.set(key, value);
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}
