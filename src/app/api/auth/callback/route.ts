import { createRouteHandlerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const supabase = await createRouteHandlerClient();

  // Handle token_hash flow (from email templates)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "signup" | "recovery" | "email",
    });

    if (error) {
      logger.error("Auth callback verifyOtp error", { error });
      return NextResponse.redirect(
        new URL("/auth/error?message=" + encodeURIComponent(error.message), baseUrl)
      );
    }

    // Rediriger directement vers la page joueur pour éviter la race condition avec /profile
    const { data: { user } } = await supabase.auth.getUser();
    const redirectPath = user ? `/players/${user.id}` : "/profile";
    return NextResponse.redirect(new URL(redirectPath, baseUrl));
  }

  // Handle code flow (PKCE)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      logger.error("Auth callback error", { error });
      return NextResponse.redirect(
        new URL("/auth/error?message=" + encodeURIComponent(error.message), baseUrl)
      );
    }

    // Rediriger directement vers la page joueur pour éviter la race condition avec /profile
    const { data: { user } } = await supabase.auth.getUser();
    const redirectPath = user ? `/players/${user.id}` : "/profile";
    return NextResponse.redirect(new URL(redirectPath, baseUrl));
  }

  // No code or token_hash provided
  return NextResponse.redirect(new URL("/auth?mode=signin", baseUrl));
}
