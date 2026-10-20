import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";

/**
 * Per-action limits (hits per window). Backed by consume_rate_limit()
 * (migration 20261018000018) so the window survives serverless cold starts.
 */
export const RATE_LIMITS = {
  review: { limit: 10, windowSeconds: 3600 },
  comment: { limit: 30, windowSeconds: 600 },
  post: { limit: 15, windowSeconds: 600 },
  message: { limit: 60, windowSeconds: 60 },
  report: { limit: 10, windowSeconds: 3600 },
  upload: { limit: 20, windowSeconds: 600 },
  friendRequest: { limit: 30, windowSeconds: 3600 },
  invitation: { limit: 30, windowSeconds: 3600 },
  prediction: { limit: 30, windowSeconds: 600 },
  coachingBooking: { limit: 10, windowSeconds: 3600 },
  search: { limit: 120, windowSeconds: 60 },
  view: { limit: 60, windowSeconds: 600 },
  gameSession: { limit: 30, windowSeconds: 3600 },
} as const;

export type RateLimitAction = keyof typeof RATE_LIMITS;

/** Who is being limited: the signed-in user, or the client IP for anonymous routes. */
export type RateLimitIdentity = { userId: string } | { request: Request };

/** First hop of x-forwarded-for (set by Vercel), then x-real-ip. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function rateLimitKey(action: RateLimitAction, identity: RateLimitIdentity): string {
  return "userId" in identity
    ? `${action}:user:${identity.userId}`
    : `${action}:ip:${clientIp(identity.request)}`;
}

/**
 * Record a hit and return a 429 response when the caller is over the limit,
 * or null when the request may proceed. Fails open (logs, allows) on a DB
 * error so a transient database issue never blocks legitimate users.
 */
export async function enforceRateLimit(
  action: RateLimitAction,
  identity: RateLimitIdentity
): Promise<NextResponse | null> {
  const { limit, windowSeconds } = RATE_LIMITS[action];
  const key = rateLimitKey(action, identity);

  try {
    const { data, error } = await getSupabaseAdmin().rpc("consume_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      logger.error("Rate limit check failed", { action, error });
      return null;
    }

    const result = data as { allowed?: boolean; retry_after?: number } | null;
    if (result?.allowed !== false) return null;

    const retryAfter = Math.max(1, Number(result.retry_after) || windowSeconds);
    return NextResponse.json(
      { error: "Too many requests", retryAfter },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  } catch (error) {
    logger.error("Unexpected rate limit error", { action, error });
    return null;
  }
}
