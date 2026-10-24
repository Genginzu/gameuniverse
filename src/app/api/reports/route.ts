import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { defineRoute, validationError } from "@/lib/api/route";
import { logger } from "@/lib/logger";
import { ReportServerService } from "@/lib/services/reportServerService";
import { ReportUserServerService } from "@/lib/services/reportUserServerService";
import type { ReportContentType, ReportReason } from "@/types/report";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

const CONTENT_TYPES: ReportContentType[] = ["review", "post", "comment", "profile"];
const REASONS: ReportReason[] = ["spam", "harassment", "inappropriate", "other"];

const reportBodySchema = z.looseObject({
  contentType: z.unknown().optional(),
  contentId: z.unknown().optional(),
  reason: z.unknown().optional(),
  description: z.unknown().optional(),
});

/** GET /api/reports — Authenticated user: list their own reports. */
export async function GET() {
  try {
    const supabase: S = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const reports = await ReportUserServerService.listMine(user.id);
    return NextResponse.json({ reports });
  } catch (error) {
    logger.error("Error in reports GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** POST /api/reports — Authenticated users flag a piece of content. */
export const POST = defineRoute(
  { auth: "required", rateLimit: "report", body: reportBodySchema },
  async ({ user, body }) => {
    const { contentType, contentId, reason, description } = body;

    if (!CONTENT_TYPES.includes(contentType as ReportContentType)) {
      throw validationError(undefined, "Invalid contentType");
    }
    if (!contentId || typeof contentId !== "string") {
      throw validationError(undefined, "contentId required");
    }
    if (!REASONS.includes(reason as ReportReason)) {
      throw validationError(undefined, "Invalid reason");
    }

    const result = await ReportServerService.createReport(user.id, {
      contentType: contentType as ReportContentType,
      contentId,
      reason: reason as ReportReason,
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
  }
);
