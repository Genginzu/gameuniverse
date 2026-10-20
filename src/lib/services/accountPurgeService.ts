import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import { fetchUserEmail } from "@/lib/services/userEmailsServerService";
import { sendDeletionCompletedEmail } from "@/lib/services/accountDeletionEmails";
import { extractStoragePathFromUrl } from "@/lib/utils/uploadUtils";
import type { AccountPurgeOutcome, AccountPurgeSummary } from "@/types/account-deletion";

/** Buckets whose files live under a `{userId}/` folder. */
const USER_BUCKETS = ["avatars", "banners", "post-images", "group-images", "community-images"];

/**
 * Removes the user's uploaded files, except the ones still shown by content
 * that survives the purge (anonymised posts, transferred groups/communities).
 */
export async function removeUserFiles(
  admin: SupabaseClient,
  userId: string,
  keptImageUrls: string[]
): Promise<number> {
  const kept = new Set(
    keptImageUrls
      .map((url) => extractStoragePathFromUrl(url))
      .filter((entry): entry is { bucket: string; path: string } => entry !== null)
      .map((entry) => `${entry.bucket}/${entry.path}`)
  );

  let removed = 0;
  for (const bucket of USER_BUCKETS) {
    const { data: files, error } = await admin.storage.from(bucket).list(userId, { limit: 1000 });
    if (error) {
      logger.warn("Account purge: could not list user files", {
        bucket,
        userId,
        error: error.message,
      });
      continue;
    }

    const paths = (files ?? [])
      .map((file) => `${userId}/${file.name}`)
      .filter((path) => !kept.has(`${bucket}/${path}`));
    if (paths.length === 0) continue;

    const { error: removeError } = await admin.storage.from(bucket).remove(paths);
    if (removeError) {
      logger.warn("Account purge: could not remove user files", {
        bucket,
        userId,
        error: removeError.message,
      });
      continue;
    }
    removed += paths.length;
  }
  return removed;
}

/**
 * Permanently deletes an account whose deletion is pending: one atomic SQL
 * purge (public.purge_account_data), then best-effort file cleanup and email.
 */
export async function purgeAccount(userId: string): Promise<AccountPurgeOutcome> {
  const admin = getSupabaseAdmin();

  const { data: profile } = await admin
    .from("profiles")
    .select("preferred_locale")
    .eq("id", userId)
    .maybeSingle();
  const email = await fetchUserEmail(userId);

  const { data, error } = await admin.rpc("purge_account_data", { p_user_id: userId });
  if (error) {
    logger.error("Account purge failed", { userId, error: error.message });
    return { userId, ok: false, error: error.message };
  }

  const summary = data as AccountPurgeSummary;
  const removedFiles = await removeUserFiles(admin, userId, summary.keptImageUrls ?? []);

  if (email) {
    const locale = (profile as { preferred_locale?: string | null } | null)?.preferred_locale;
    await sendDeletionCompletedEmail(email, locale);
  }

  logger.info("Account purged", { userId, removedFiles, ...summary, keptImageUrls: undefined });
  return { userId, ok: true, summary, removedFiles };
}
