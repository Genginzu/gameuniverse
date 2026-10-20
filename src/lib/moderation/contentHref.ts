import { ownEntry } from "@/lib/utils/ownEntry";
import type { ContentHrefContext, ReportContentType } from "@/types/report";

export const playerActivityHref = (playerId: string) => `/players/${playerId}?tab=activity`;
export const playerReviewsHref = (playerId: string) => `/players/${playerId}?tab=reviews`;

const CONTENT_HREFS: Record<ReportContentType, (context: ContentHrefContext) => string | null> = {
  review: ({ authorId, gameSlug }) =>
    gameSlug ? `/games/${gameSlug}` : playerReviewsHref(authorId),
  post: ({ authorId }) => playerActivityHref(authorId),
  comment: ({ postOwnerId }) => (postOwnerId ? playerActivityHref(postOwnerId) : null),
  profile: ({ authorId }) => `/players/${authorId}`,
};

export function isReportContentType(value: string): value is ReportContentType {
  return ownEntry(CONTENT_HREFS, value) !== undefined;
}

export function contentHref(
  contentType: ReportContentType,
  context: ContentHrefContext
): string | null {
  return CONTENT_HREFS[contentType](context);
}
