import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import { contentAuthorWarned } from "@/lib/services/notifications";
import { isValidSuspensionDays, suspensionEndDate } from "@/lib/utils/suspension";
import type { ModerationOptions, ReportAction, ReportContentType } from "@/types/report";

/** Maps a content type to its table and author column. */
export const CONTENT_TABLE_MAP: Record<
  ReportContentType,
  { table: string; authorColumn: string; contentColumn: string; deletable: boolean }
> = {
  review: {
    table: "game_reviews",
    authorColumn: "user_id",
    contentColumn: "content",
    deletable: true,
  },
  post: {
    table: "player_posts",
    authorColumn: "player_id",
    contentColumn: "content",
    deletable: true,
  },
  comment: {
    table: "post_comments",
    authorColumn: "player_id",
    contentColumn: "content",
    deletable: true,
  },
  profile: { table: "profiles", authorColumn: "id", contentColumn: "username", deletable: false },
};

/** Resolve the author id of a reported piece of content. */
export async function resolveAuthorId(
  contentType: ReportContentType,
  contentId: string
): Promise<string | null> {
  if (contentType === "profile") return contentId;
  const mapping = CONTENT_TABLE_MAP[contentType];

  const { data, error } = await getSupabaseAdmin()
    .from(mapping.table)
    .select(mapping.authorColumn)
    .eq("id", contentId)
    .single();

  if (error || !data) {
    logger.error("Failed to resolve content author", {
      error: error?.message,
      contentType,
      contentId,
    });
    return null;
  }
  return (data as unknown as Record<string, string>)[mapping.authorColumn] ?? null;
}

/**
 * Apply a moderation side effect to the reported content.
 * Returns true on success (or when nothing needs to be done).
 */
export async function applyModerationAction(
  action: ReportAction,
  contentType: ReportContentType,
  contentId: string,
  adminId: string,
  options: ModerationOptions = {}
): Promise<boolean> {
  if (action === "none") return true;
  const supabase = getSupabaseAdmin();
  const mapping = CONTENT_TABLE_MAP[contentType];

  if (action === "content_deleted") {
    if (!mapping.deletable) return false;
    const { error } = await supabase.from(mapping.table).delete().eq("id", contentId);
    if (error) {
      logger.error("Failed to delete reported content", {
        error: error.message,
        contentType,
        contentId,
      });
      return false;
    }
    return true;
  }

  const authorId = await resolveAuthorId(contentType, contentId);
  if (!authorId) return false;

  if (action === "author_warned") {
    await contentAuthorWarned({ authorId, moderatorId: adminId, contentType, contentId });
    return true;
  }

  if (action === "author_suspended") {
    if (!isValidSuspensionDays(options.suspensionDays)) return false;
    const now = new Date();
    const { error } = await supabase
      .from("profiles")
      .update({
        is_suspended: true,
        suspended_at: now.toISOString(),
        suspended_until: suspensionEndDate(options.suspensionDays, now).toISOString(),
        suspended_reason: "content_report",
      })
      .eq("id", authorId);
    if (error) {
      logger.error("Failed to suspend author", { error: error.message, authorId });
      return false;
    }
    return true;
  }

  return false;
}
