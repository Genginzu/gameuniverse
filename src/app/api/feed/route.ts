import { NextRequest, NextResponse } from "next/server";
import { FriendsFeedServerService } from "@/lib/services/friendsFeedServerService";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type { FeedEventType } from "@/types/feed";

const VALID_TYPES: FeedEventType[] = [
  "review",
  "post",
  "comment",
  "library",
  "playtime",
  "favorite",
  "collection",
  "friendship",
  "session",
  "achievement",
];

function parsePage(searchParams: URLSearchParams): number {
  const raw = searchParams.get("page");
  if (raw === null) return 1;
  const parsed = parseInt(raw, 10);
  return !isNaN(parsed) && parsed >= 1 ? parsed : 1;
}

function parseType(searchParams: URLSearchParams): FeedEventType | null {
  const raw = searchParams.get("type");
  if (!raw) return null;
  return VALID_TYPES.includes(raw as FeedEventType) ? (raw as FeedEventType) : null;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parsePage(searchParams);
    const locale = searchParams.get("locale") || "fr";
    const typeFilter = parseType(searchParams);

    const feedResponse = await FriendsFeedServerService.fetchFriendsFeed(
      user.id,
      locale,
      typeFilter,
      page
    );

    return NextResponse.json(feedResponse);
  } catch (error) {
    logger.error("Error in friends feed API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
