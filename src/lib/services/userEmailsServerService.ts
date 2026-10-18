import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";

/**
 * Server-only helpers to resolve user emails from auth.users.
 *
 * Emails are no longer duplicated in public.profiles (issue #375): auth.users
 * is the single source of truth and is only reachable with the service-role
 * client. These helpers MUST be called from trusted server code (admin routes,
 * notification/email flows) after the caller's authorization has been checked.
 */

interface AuthUserEmailRow {
  id: string;
  email: string | null;
}

/**
 * Resolve the emails for a set of user ids in a single query.
 * Returns a map keyed by user id; ids without an email are omitted.
 */
export async function fetchUserEmails(userIds: string[]): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  const uniqueIds = [...new Set(userIds)].filter(Boolean);
  if (uniqueIds.length === 0) return map;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .schema("auth")
    .from("users")
    .select("id, email")
    .in("id", uniqueIds);

  if (error) {
    logger.error("Failed to fetch user emails from auth.users", { error: error.message });
    return map;
  }

  for (const row of (data ?? []) as AuthUserEmailRow[]) {
    map.set(row.id, row.email ?? null);
  }

  return map;
}

/**
 * Resolve a single user's email from auth.users. Returns null when unknown.
 */
export async function fetchUserEmail(userId: string): Promise<string | null> {
  if (!userId) return null;
  const map = await fetchUserEmails([userId]);
  return map.get(userId) ?? null;
}
