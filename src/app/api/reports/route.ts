import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { ReportServerService } from "@/lib/services/reportServerService";
import type { ReportContentType, ReportReason } from "@/types/report";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

const CONTENT_TYPES: ReportContentType[] = ["review", "post", "comment", "profile"];
const REASONS: ReportReason[] = ["spam", "harassment", "inappropriate", "other"];

/** POST /api/reports — Authenticated users flag a piece of content. */
export async function POST(request: NextRequest) {
  try {
    const supabase: S = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { contentType, contentId, reason, description } = await request.json();

    if (!CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "Invalid contentType" }, { status: 400 });
    }
    if (!contentId || typeof contentId !== "string") {
      return NextResponse.json({ error: "contentId required" }, { status: 400 });
    }
    if (!REASONS.includes(reason)) {
      return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
    }

    const result = await ReportServerService.createReport(user.id, {
      contentType,
      contentId,
      reason,
      description: typeof description === "string" ? description.slice(0, 1000) : null,
    });

    if (!result.ok) {
      if (result.code === "limit") {
        return NextResponse.json(
          { error: "Daily report limit reached", code: "limit" },
          { status: 429 }
        );
      }
      if (result.code === "duplicate") {
        return NextResponse.json(
          { error: "Content already reported", code: "duplicate" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
    }

    return NextResponse.json({ report: result.report }, { status: 201 });
  } catch (error) {
    logger.error("Error in reports POST", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
