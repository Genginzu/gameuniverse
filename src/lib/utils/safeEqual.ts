import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Constant-time string comparison for shared secrets. Both values are hashed
 * first so the comparison length never depends on the input.
 */
export function safeEqual(provided: string | null | undefined, expected: string): boolean {
  if (typeof provided !== "string" || expected.length === 0) return false;
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Bearer token from the Authorization header, or null. */
export function bearerToken(header: string | null): string | null {
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}
