import type { PlayerReviewsQueryParams } from "@/types/playerReview";

/**
 * Build the API URL for fetching player reviews.
 * Only includes query params whose value is not undefined.
 */
export function buildReviewsUrl(playerId: string, params: PlayerReviewsQueryParams): string {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) {
    searchParams.set("page", String(params.page));
  }
  if (params.sort !== undefined) {
    searchParams.set("sort", params.sort);
  }
  if (params.locale !== undefined) {
    searchParams.set("locale", params.locale);
  }

  const query = searchParams.toString();
  return `/api/players/${playerId}/reviews${query ? `?${query}` : ""}`;
}
