import type { FeedQueryParams, FeedResponse } from "@/types/feed";

export class FriendsFeedService {
  static async fetchFeed(params: FeedQueryParams = {}): Promise<FeedResponse> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.set("page", String(params.page));
    if (params.locale !== undefined) searchParams.set("locale", params.locale);
    if (params.type !== undefined) searchParams.set("type", params.type);

    const query = searchParams.toString();
    const url = `/api/feed${query ? `?${query}` : ""}`;

    const response = await fetch(url);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || `Failed to fetch feed: ${response.status}`);
    }
    return response.json();
  }
}
