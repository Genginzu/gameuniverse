/**
 * Auth hint: a cheap, synchronous guess that the visitor is logged in.
 *
 * The home page is ISR (no cookies on the server), so the real session is
 * only known after `supabase.auth.getSession()` resolves on the client. The
 * Supabase SSR client stores the session in a readable `sb-<ref>-auth-token`
 * cookie (possibly chunked as `.0`, `.1`…). Its presence is enough to render a
 * neutral editorial skeleton instead of flashing the visitor landing.
 */

export const AUTH_HINT_ATTRIBUTE = "data-auth-hint";

const AUTH_COOKIE_PATTERN = /(?:^|;\s*)sb-[^=;]+-auth-token(?:\.\d+)?=[^;]/;

export function hasAuthCookie(cookieHeader: string): boolean {
  return AUTH_COOKIE_PATTERN.test(cookieHeader);
}

/** Inline script run before first paint to flag `<html>` when a session cookie exists. */
export const AUTH_HINT_SCRIPT = `try{if(${AUTH_COOKIE_PATTERN.toString()}.test(document.cookie))document.documentElement.setAttribute("${AUTH_HINT_ATTRIBUTE}","")}catch(e){}`;
