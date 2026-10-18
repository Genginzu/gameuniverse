import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";

/**
 * Returns the end of the user's active suspension, or null when not suspended.
 * Mirrors the SQL function public.is_user_suspended (which RLS enforces).
 */
export async function getActiveSuspension(
  userId: string
): Promise<{ until: string | null } | null> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("profiles")
      .select("is_suspended, suspended_until")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    const row = data as { is_suspended?: boolean; suspended_until?: string | null } | null;
    if (!row?.is_suspended) return null;
    if (row.suspended_until && new Date(row.suspended_until) <= new Date()) return null;
    return { until: row.suspended_until ?? null };
  } catch (error) {
    // Fail open: this check only provides a friendly error, RLS still blocks writes.
    logger.error("Failed to read suspension status", { error, userId });
    return null;
  }
}

/** 403 response for suspended accounts, or null when the user may write content. */
export async function suspendedResponse(userId: string): Promise<NextResponse | null> {
  const suspension = await getActiveSuspension(userId);
  if (!suspension) return null;
  return NextResponse.json(
    { error: "Account suspended", code: "suspended", suspendedUntil: suspension.until },
    { status: 403 }
  );
}
