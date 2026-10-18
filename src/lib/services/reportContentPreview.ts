import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import type { ContentReport, ReportContentPreview, ReportContentType } from "@/types/report";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const PREVIEW_LENGTH = 280;

/** Strip HTML (reviews are rich text) and truncate to a readable excerpt. */
function excerpt(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH)}…` : text;
}

const key = (type: ReportContentType, id: string) => `${type}:${id}`;

async function fetchRows(table: string, select: string, ids: string[]): Promise<Row[]> {
  if (ids.length === 0) return [];
  const { data, error } = await getSupabaseAdmin().from(table).select(select).in("id", ids);
  if (error) {
    logger.error("Failed to load reported content", { error: error.message, table });
    return [];
  }
  return (data ?? []) as unknown as Row[];
}

/** Build a preview map keyed by `${contentType}:${contentId}`. */
async function loadPreviews(reports: ContentReport[]): Promise<Map<string, ReportContentPreview>> {
  const ids = (type: ReportContentType) => [
    ...new Set(reports.filter((r) => r.contentType === type).map((r) => r.contentId)),
  ];

  const [reviews, posts, comments, profiles] = await Promise.all([
    fetchRows("game_reviews", "id, content, user_id, games(slug)", ids("review")),
    fetchRows("player_posts", "id, content, player_id", ids("post")),
    fetchRows("post_comments", "id, content, player_id, player_posts(player_id)", ids("comment")),
    fetchRows("profiles", "id, username", ids("profile")),
  ]);

  const partial = new Map<string, Omit<ReportContentPreview, "authorName">>();
  for (const r of reviews) {
    partial.set(key("review", r.id), {
      exists: true,
      text: excerpt(r.content),
      authorId: r.user_id,
      href: r.games?.slug ? `/games/${r.games.slug}` : null,
    });
  }
  for (const p of posts) {
    partial.set(key("post", p.id), {
      exists: true,
      text: excerpt(p.content),
      authorId: p.player_id,
      href: `/players/${p.player_id}?tab=posts`,
    });
  }
  for (const c of comments) {
    const owner = c.player_posts?.player_id;
    partial.set(key("comment", c.id), {
      exists: true,
      text: excerpt(c.content),
      authorId: c.player_id,
      href: owner ? `/players/${owner}?tab=posts` : null,
    });
  }
  for (const p of profiles) {
    partial.set(key("profile", p.id), {
      exists: true,
      text: p.username ?? null,
      authorId: p.id,
      href: `/players/${p.id}`,
    });
  }

  const authorIds = [...new Set([...partial.values()].map((p) => p.authorId).filter(Boolean))];
  const authors = await fetchRows("profiles", "id, username", authorIds as string[]);
  const names = new Map(authors.map((a) => [a.id as string, (a.username as string) ?? null]));

  const result = new Map<string, ReportContentPreview>();
  for (const [k, p] of partial) {
    result.set(k, { ...p, authorName: p.authorId ? (names.get(p.authorId) ?? null) : null });
  }
  return result;
}

const MISSING: ReportContentPreview = {
  exists: false,
  text: null,
  authorId: null,
  authorName: null,
  href: null,
};

/** Attach a content preview to each report (content may have been deleted since). */
export async function withContentPreviews(reports: ContentReport[]): Promise<ContentReport[]> {
  if (reports.length === 0) return reports;
  const previews = await loadPreviews(reports);
  return reports.map((r) => ({
    ...r,
    content: previews.get(key(r.contentType, r.contentId)) ?? MISSING,
  }));
}
