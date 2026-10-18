import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { logger } from "@/lib/logger";

type RouteParams = { params: Promise<{ id: string }> };

// Table not yet in generated Supabase types (migration applied but types not regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

/**
 * PATCH /api/admin/groups/[id] — Suspend or restore a group.
 * Suspending forces visibility to "private" (hides it from public listing
 * and search without deleting data). Restoring sets it back to "public".
 * Body: { visibility: "public" | "private" }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { id: groupId } = await params;
    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const visibility = body?.visibility;
    if (visibility !== "public" && visibility !== "private") {
      return NextResponse.json(
        { error: "visibility must be 'public' or 'private'" },
        { status: 400 }
      );
    }

    const supabase = await createRouteHandlerClient();

    const { data: existing, error: checkError } = await supabase
      .from("groups" as UntypedFrom)
      .select("id")
      .eq("id", groupId)
      .maybeSingle();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("groups" as UntypedFrom)
      .update({ visibility })
      .eq("id", groupId);

    if (updateError) {
      logger.error("Error updating group visibility", { error: updateError });
      return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in admin group PATCH", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/groups/[id] — Permanently delete a group and its members/posts (cascade).
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { id: groupId } = await params;
    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    const { data: existing, error: checkError } = await supabase
      .from("groups" as UntypedFrom)
      .select("id")
      .eq("id", groupId)
      .maybeSingle();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from("groups" as UntypedFrom)
      .delete()
      .eq("id", groupId);

    if (deleteError) {
      logger.error("Error deleting group", { error: deleteError });
      return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in admin group DELETE", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
