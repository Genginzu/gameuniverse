import { createRouteHandlerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import {
  isAllowedOtpType,
  isSafeRelativePath,
  isSameOriginSubmission,
} from "@/lib/utils/authLinks";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

/** After a POST, 303 so the browser follows with a GET. */
function redirectAfterPost(path: string): NextResponse {
  return NextResponse.redirect(new URL(path, siteUrl()), 303);
}

async function landingPath(supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>) {
  // Rediriger directement vers la page joueur pour éviter la race condition avec /profile
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? `/players/${user.id}` : "/profile";
}

/**
 * GET /api/auth/callback
 * - `code` (PKCE): exchanged here. Safe as a GET: the code verifier cookie only
 *   exists in the browser that started the flow.
 * - `token_hash` (email links): NOT verified on GET. Anyone can forward their
 *   own link, so verifying on open would silently log the victim into the
 *   sender's account (login CSRF), and mail scanners would burn the token.
 *   The user is sent to an interstitial that POSTs back here.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const baseUrl = siteUrl();

  if (tokenHash && isAllowedOtpType(type)) {
    const confirmUrl = new URL("/auth/confirm", baseUrl);
    confirmUrl.searchParams.set("token", tokenHash);
    confirmUrl.searchParams.set("type", type);
    return NextResponse.redirect(confirmUrl);
  }

  if (code) {
    const supabase = await createRouteHandlerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      logger.error("Auth callback error", { error });
      return NextResponse.redirect(new URL("/auth/error?reason=invalid_link", baseUrl));
    }

    return NextResponse.redirect(new URL(await landingPath(supabase), baseUrl));
  }

  // No code or token_hash provided
  return NextResponse.redirect(new URL("/auth?mode=signin", baseUrl));
}

/**
 * POST /api/auth/callback — explicit confirmation of an email link, submitted
 * by the /auth/confirm interstitial. Same-origin only, so another site cannot
 * auto-submit a forwarded token (login CSRF).
 */
export async function POST(request: NextRequest) {
  const allowedOrigins = [new URL(siteUrl()).origin, request.nextUrl.origin];
  if (!isSameOriginSubmission(request.headers, allowedOrigins)) {
    return redirectAfterPost("/auth/error?reason=forbidden");
  }

  const form = await request.formData().catch(() => null);
  const tokenHash = form?.get("token_hash");
  const type = form?.get("type");
  const next = form?.get("next");

  if (typeof tokenHash !== "string" || !tokenHash || !isAllowedOtpType(type)) {
    return redirectAfterPost("/auth?mode=signin");
  }

  const supabase = await createRouteHandlerClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) {
    logger.error("Auth callback verifyOtp error", { error });
    return redirectAfterPost("/auth/error?reason=invalid_link");
  }

  return redirectAfterPost(isSafeRelativePath(next) ? next : await landingPath(supabase));
}
