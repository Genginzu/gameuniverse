import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { NotificationServerService } from "@/lib/services/notificationServerService";
import { typesForCategory, type NotificationCategory } from "@/lib/notificationDisplay";
import { logger } from "@/lib/logger";

const VALID_CATEGORIES: readonly string[] = [
  "friends",
  "reviews",
  "mentions",
  "achievements",
  "coaching",
  "activity",
];

/**
 * GET /api/notifications
 *
 * Two modes:
 *  - Bell dropdown (default): returns the latest unread notifications only,
 *    shape `{ notifications }`.
 *  - Notification center: when `page`, `type` or `status` is present, returns a
 *    paginated/filterable slice, shape `{ notifications, total }`.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const isCenterMode =
      searchParams.has("page") || searchParams.has("type") || searchParams.has("status");

    if (isCenterMode) {
      const page = Number(searchParams.get("page")) || 1;
      const limit = Number(searchParams.get("limit")) || 20;

      const statusParam = searchParams.get("status");
      const status: "all" | "unread" | "read" =
        statusParam === "unread" || statusParam === "read" ? statusParam : "all";

      const typeParam = searchParams.get("type");
      const category =
        typeParam && VALID_CATEGORIES.includes(typeParam)
          ? (typeParam as NotificationCategory)
          : "all";
      const types = typesForCategory(category);

      const { notifications, total } = await NotificationServerService.getAll(user.id, {
        page,
        limit,
        types,
        status,
      });

      return NextResponse.json({ notifications, total });
    }

    const limit = Number(searchParams.get("limit")) || 20;
    const notifications = await NotificationServerService.getUnread(user.id, limit);

    return NextResponse.json({ notifications });
  } catch (error) {
    logger.error("Error in notifications GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
