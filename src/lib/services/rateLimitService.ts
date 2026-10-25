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
  accountDeletion: { limit: 5, windowSeconds: 3600 },
  coachingProfile: { limit: 30, windowSeconds: 600 },
  coachingPayout: { limit: 3, windowSeconds: 3600 },
  groupCreate: { limit: 5, windowSeconds: 3600 },
  groupUpdate: { limit: 20, windowSeconds: 3600 },
  membership: { limit: 30, windowSeconds: 3600 },
  collection: { limit: 20, windowSeconds: 3600 },
  collectionItem: { limit: 120, windowSeconds: 600 },
  library: { limit: 120, windowSeconds: 600 },
  favorite: { limit: 60, windowSeconds: 600 },
  vote: { limit: 60, windowSeconds: 600 },
  reaction: { limit: 60, windowSeconds: 60 },
  follow: { limit: 60, windowSeconds: 3600 },
  profileUpdate: { limit: 20, windowSeconds: 3600 },
  platformLink: { limit: 20, windowSeconds: 3600 },
  fantasyTeam: { limit: 10, windowSeconds: 3600 },
  goal: { limit: 30, windowSeconds: 3600 },
  recommendationRefresh: { limit: 5, windowSeconds: 600 },
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

export type RateLimitDecision = { allowed: true } | { allowed: false; retryAfter: number };

/**
 * Record a hit and tell whether the caller is still under the limit. Fails
 * open (logs, allows) on a DB error so a transient database issue never
 * blocks legitimate users.
 */
export async function consumeRateLimit(
  action: RateLimitAction,
  identity: RateLimitIdentity
): Promise<RateLimitDecision> {
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
      return { allowed: true };
    }

    const result = data as { allowed?: boolean; retry_after?: number } | null;
    if (result?.allowed !== false) return { allowed: true };

    return { allowed: false, retryAfter: Math.max(1, Number(result.retry_after) || windowSeconds) };
  } catch (error) {
    logger.error("Unexpected rate limit error", { action, error });
    return { allowed: true };
  }
}

/**
 * Record a hit and return a 429 response when the caller is over the limit,
 * or null when the request may proceed. Routes built with `defineRoute`
 * declare `rateLimit` instead.
 */
export async function enforceRateLimit(
  action: RateLimitAction,
  identity: RateLimitIdentity
): Promise<NextResponse | null> {
  const decision = await consumeRateLimit(action, identity);
  if (decision.allowed) return null;
  return NextResponse.json(
    { error: "Too many requests", code: "rate_limited", retryAfter: decision.retryAfter },
    { status: 429, headers: { "Retry-After": String(decision.retryAfter) } }
  );
}
