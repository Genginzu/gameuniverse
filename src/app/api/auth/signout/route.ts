import { createRouteHandlerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST() {
  const supabase = await createRouteHandlerClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    logger.error("Sign out error", { error });
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
