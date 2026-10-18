import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";

/**
 * Server-only helpers to resolve user emails from auth.users.
 *
 * Emails are no longer duplicated in public.profiles (issue #375): auth.users
 * is the single source of truth. The auth schema is intentionally not exposed
 * through PostgREST (querying it returns PGRST106, issue #387), so emails are
 * read through the GoTrue admin API with the service-role client. These
 * helpers MUST be called from trusted server code (admin routes,
 * notification/email flows) after the caller's authorization has been checked.
 */

/** Caps parallel GoTrue admin calls so a large page does not flood the Auth API. */
const MAX_CONCURRENT_LOOKUPS = 10;

async function lookupEmail(userId: string): Promise<string | null | undefined> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.auth.admin.getUserById(userId);

  if (error) {
    logger.error("Failed to fetch user email from auth admin API", {
      userId,
      error: error.message,
    });
    return undefined;
  }

  return data.user?.email ?? null;
}

/**
 * Resolve the emails for a set of user ids.
 * Returns a map keyed by user id; ids that cannot be resolved are omitted.
 */
export async function fetchUserEmails(userIds: string[]): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  const uniqueIds = [...new Set(userIds)].filter(Boolean);

  for (let start = 0; start < uniqueIds.length; start += MAX_CONCURRENT_LOOKUPS) {
    const batch = uniqueIds.slice(start, start + MAX_CONCURRENT_LOOKUPS);
    const emails = await Promise.all(batch.map(lookupEmail));
    batch.forEach((userId, index) => {
      const email = emails[index];
      if (email !== undefined) map.set(userId, email);
    });
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
