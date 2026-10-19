import { contentHref } from "@/lib/moderation/contentHref";
import type {
  ReportContentPreview,
  ReportContentType,
  ReportableContentDescriptor,
  ReportableContentRow,
} from "@/types/report";

const PREVIEW_LENGTH = 280;

export function excerpt(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH)}…` : text;
}

function stringField(row: ReportableContentRow, column: string): string | null {
  const value = row[column];
  return typeof value === "string" ? value : null;
}

function relationField(row: ReportableContentRow, relation: string, column: string) {
  const related = row[relation];
  if (!related || typeof related !== "object") return null;
  return stringField(related as ReportableContentRow, column);
}

export const REPORTABLE_CONTENT: Record<ReportContentType, ReportableContentDescriptor> = {
  review: {
    table: "game_reviews",
    authorColumn: "user_id",
    previewSelect: "id, content, user_id, games(slug)",
    deletable: true,
    previewText: (row) => excerpt(row.content),
    hrefContext: (row) => ({ gameSlug: relationField(row, "games", "slug") }),
  },
  post: {
    table: "player_posts",
    authorColumn: "player_id",
    previewSelect: "id, content, player_id",
    deletable: true,
    previewText: (row) => excerpt(row.content),
    hrefContext: () => ({}),
  },
  comment: {
    table: "post_comments",
    authorColumn: "player_id",
    previewSelect: "id, content, player_id, player_posts(player_id)",
    deletable: true,
    previewText: (row) => excerpt(row.content),
    hrefContext: (row) => ({ postOwnerId: relationField(row, "player_posts", "player_id") }),
  },
  profile: {
    table: "profiles",
    authorColumn: "id",
    previewSelect: "id, username",
    deletable: false,
    previewText: (row) => stringField(row, "username"),
    hrefContext: () => ({}),
  },
};

export const REPORT_CONTENT_TYPES = Object.keys(REPORTABLE_CONTENT) as ReportContentType[];

export function reportableContent(contentType: ReportContentType): ReportableContentDescriptor {
  return REPORTABLE_CONTENT[contentType];
}

export function buildContentPreview(
  contentType: ReportContentType,
  row: ReportableContentRow
): Omit<ReportContentPreview, "authorName"> {
  const descriptor = reportableContent(contentType);
  const authorId = stringField(row, descriptor.authorColumn);
  return {
    exists: true,
    text: descriptor.previewText(row),
    authorId,
    href: authorId ? contentHref(contentType, { authorId, ...descriptor.hrefContext(row) }) : null,
  };
}
