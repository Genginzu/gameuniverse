import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type { TrendingTagsResponse } from "@/types/post";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Untyped = any;

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

interface TrendingTagRow {
  tag: string;
  post_count: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseInt(searchParams.get("limit") ?? "", 10);
    const limit = Number.isNaN(parsed) ? DEFAULT_LIMIT : Math.min(Math.max(1, parsed), MAX_LIMIT);

    const supabase = await createRouteHandlerClient();

    const { data, error } = await supabase.rpc("get_trending_post_tags" as Untyped, {
      tag_limit: limit,
    } as Untyped);

    if (error) {
      logger.error("Failed to fetch trending tags", { error: (error as Error).message });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    const tags = ((data ?? []) as unknown as TrendingTagRow[]).map((row) => ({
      tag: row.tag,
      count: Number(row.post_count),
    }));

    const response: TrendingTagsResponse = { tags };
    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error in trending tags GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
