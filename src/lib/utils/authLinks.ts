/**
 * Shared checks for auth links and redirects (email OTP links, OAuth returns).
 */

export const EMAIL_OTP_TYPES = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
] as const;

export type EmailLinkOtpType = (typeof EMAIL_OTP_TYPES)[number];

export function isAllowedOtpType(value: unknown): value is EmailLinkOtpType {
  return typeof value === "string" && (EMAIL_OTP_TYPES as readonly string[]).includes(value);
}

/** Same-origin relative path only: a single leading "/", no "//", "\" or "scheme://". */
export function isSafeRelativePath(path: unknown): path is string {
  return (
    typeof path === "string" &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("\\") &&
    !path.includes("://")
  );
}

/**
 * CSRF check for state-changing form posts: the browser must report a
 * same-origin request (Sec-Fetch-Site), or send an Origin we serve.
 */
export function isSameOriginSubmission(headers: Headers, allowedOrigins: string[]): boolean {
  const fetchSite = headers.get("sec-fetch-site");
  if (fetchSite) return fetchSite === "same-origin";
  const origin = headers.get("origin");
  return origin !== null && allowedOrigins.includes(origin);
}
