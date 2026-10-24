import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { defineRoute, notFound, validationError } from "@/lib/api/route";
import { logger } from "@/lib/logger";

// Table not yet in generated Supabase types (migration applied but types not regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

const visibilitySchema = z.object({ visibility: z.enum(["public", "private"]) });

/**
 * PATCH /api/admin/groups/[id] — Suspend or restore a group.
 * Suspending forces visibility to "private" (hides it from public listing
 * and search without deleting data). Restoring sets it back to "public".
 * Body: { visibility: "public" | "private" }
 */
export const PATCH = defineRoute(
  { auth: "admin", body: visibilitySchema },
  async ({ params, body }) => {
    const { id: groupId } = params;
    if (!groupId) throw validationError(undefined, "Group ID is required");

    const { visibility } = body;

    const supabase = await createRouteHandlerClient();

    const { data: existing, error: checkError } = await supabase
      .from("groups" as UntypedFrom)
      .select("id")
      .eq("id", groupId)
      .maybeSingle();

    if (checkError || !existing) throw notFound("Group not found");

    const { error: updateError } = await supabase
      .from("groups" as UntypedFrom)
      .update({ visibility })
      .eq("id", groupId);

    if (updateError) {
      logger.error("Error updating group visibility", { error: updateError });
      return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }
);

/**
 * DELETE /api/admin/groups/[id] — Permanently delete a group and its members/posts (cascade).
 */
export const DELETE = defineRoute({ auth: "admin" }, async ({ params }) => {
  const { id: groupId } = params;
  if (!groupId) throw validationError(undefined, "Group ID is required");

  const supabase = await createRouteHandlerClient();

  const { data: existing, error: checkError } = await supabase
    .from("groups" as UntypedFrom)
    .select("id")
    .eq("id", groupId)
    .maybeSingle();

  if (checkError || !existing) throw notFound("Group not found");

  const { error: deleteError } = await supabase
    .from("groups" as UntypedFrom)
    .delete()
    .eq("id", groupId);

  if (deleteError) {
    logger.error("Error deleting group", { error: deleteError });
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
