import { createServerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type { FeedEvent, FeedEventType, FeedResponse } from "@/types/feed";

const FEED_PAGE_SIZE = 20;

interface RpcFeedResult {
  events: Array<{
    id: string;
    type: string;
    date: string;
    data: Record<string, unknown>;
  }>;
  totalCount: number;
}

function emptyResponse(page: number): FeedResponse {
  return {
    events: [],
    pagination: {
      currentPage: page,
      totalPages: 0,
      hasNextPage: false,
    },
  };
}

export class FriendsFeedServerService {
  static async fetchFriendsFeed(
    viewerId: string,
    locale: string,
    typeFilter?: FeedEventType | null,
    page: number = 1
  ): Promise<FeedResponse> {
    const supabase = await createServerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.rpc("get_friends_feed" as any, {
      viewer_uuid: viewerId,
      locale_code: locale,
      event_type: typeFilter ?? null,
      page_number: page,
      page_size: FEED_PAGE_SIZE,
    });

    if (error) {
      if (error.code === "PGRST205" || error.code === "42883") {
        logger.warn("get_friends_feed function not found - migration not applied yet");
        return emptyResponse(page);
      }
      throw error;
    }

    const result = data as unknown as RpcFeedResult | null;

    if (!result) {
      return emptyResponse(page);
    }

    return transformRpcResult(result, page);
  }
}

function transformRpcResult(result: RpcFeedResult, page: number): FeedResponse {
  const totalCount = result.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / FEED_PAGE_SIZE);

  const events: FeedEvent[] = (result.events ?? []).map((raw) => ({
    id: String(raw.id),
    type: raw.type as FeedEventType,
    date: raw.date,
    data: raw.data as unknown as FeedEvent["data"],
  }));

  return {
    events,
    pagination: {
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
    },
  };
}
