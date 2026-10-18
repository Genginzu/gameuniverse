import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { ReportUserServerService } from "@/lib/services/reportUserServerService";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

type RouteParams = { params: Promise<{ id: string }> };

/** DELETE /api/reports/[id] — Reporter: withdraw one of their own open reports. */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase: S = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const result = await ReportUserServerService.cancel(id, user.id);

    if (result === "not_found") {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    if (result === "closed") {
      return NextResponse.json(
        { error: "Report already handled", code: "closed" },
        { status: 409 }
      );
    }
    if (result === "error") {
      return NextResponse.json({ error: "Failed to cancel report" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in report DELETE", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
