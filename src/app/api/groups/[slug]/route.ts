import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { defineRoute, forbidden, notFound } from "@/lib/api/route";
import { GroupServerService } from "@/lib/services/groupServerService";
import { GroupMembersServerService } from "@/lib/services/groupMembersServerService";
import { updateGroupSchema } from "@/lib/validations/group";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * GET /api/groups/[slug] — Group detail.
 * Returns 404 if the group is private and the viewer is not a member.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const group = await GroupServerService.fetchGroupBySlug(slug, user?.id);

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.visibility === "private" && group.viewerRole === null) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json({ group });
  } catch (error) {
    logger.error("Error in group GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/groups/[slug] — Update a group.
 * Authentication required. Only owner/admin members can update.
 */
export const PATCH = defineRoute(
  { auth: "required", rateLimit: "groupUpdate", writesContent: true, body: updateGroupSchema },
  async ({ user, params, body }) => {
    const { slug } = params;

    const access = await GroupServerService.getGroupAccess(slug);
    if (!access) throw notFound("Group not found");

    const role = await GroupMembersServerService.getMemberRole(access.id, user.id);
    if (role !== "owner" && role !== "moderator") throw forbidden("Forbidden");

    await GroupServerService.updateGroup(slug, body);
    const updated = await GroupServerService.fetchGroupBySlug(slug, user.id);

    return NextResponse.json({ group: updated });
  }
);

/**
 * DELETE /api/groups/[slug] — Delete a group.
 * Authentication required. Only the owner can delete.
 */
export const DELETE = defineRoute({ auth: "required" }, async ({ user, params }) => {
  const { slug } = params;

  const access = await GroupServerService.getGroupAccess(slug);
  if (!access) throw notFound("Group not found");

  if (access.ownerId !== user.id) throw forbidden("Forbidden");

  await GroupServerService.deleteGroup(slug);

  return new NextResponse(null, { status: 204 });
});
