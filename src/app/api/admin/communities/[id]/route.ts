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
 * PATCH /api/admin/communities/[id] — Suspend or restore a community.
 * Suspending forces visibility to "private" (hides it from public listing
 * and search without deleting data). Restoring sets it back to "public".
 * Body: { visibility: "public" | "private" }
 */
export const PATCH = defineRoute(
  { auth: "admin", body: visibilitySchema },
  async ({ params, body }) => {
    const { id: communityId } = params;
    if (!communityId) throw validationError(undefined, "Community ID is required");

    const { visibility } = body;

    const supabase = await createRouteHandlerClient();

    const { data: existing, error: checkError } = await supabase
      .from("communities" as UntypedFrom)
      .select("id")
      .eq("id", communityId)
      .maybeSingle();

    if (checkError || !existing) throw notFound("Community not found");

    const { error: updateError } = await supabase
      .from("communities" as UntypedFrom)
      .update({ visibility })
      .eq("id", communityId);

    if (updateError) {
      logger.error("Error updating community visibility", { error: updateError });
      return NextResponse.json({ error: "Failed to update community" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }
);

/**
 * DELETE /api/admin/communities/[id] — Permanently delete a community and its
 * members/posts (cascade).
 */
export const DELETE = defineRoute({ auth: "admin" }, async ({ params }) => {
  const { id: communityId } = params;
  if (!communityId) throw validationError(undefined, "Community ID is required");

  const supabase = await createRouteHandlerClient();

  const { data: existing, error: checkError } = await supabase
    .from("communities" as UntypedFrom)
    .select("id")
    .eq("id", communityId)
    .maybeSingle();

  if (checkError || !existing) throw notFound("Community not found");

  const { error: deleteError } = await supabase
    .from("communities" as UntypedFrom)
    .delete()
    .eq("id", communityId);

  if (deleteError) {
    logger.error("Error deleting community", { error: deleteError });
    return NextResponse.json({ error: "Failed to delete community" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
