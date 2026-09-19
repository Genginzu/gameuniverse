import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { GroupServerService } from "@/lib/services/groupServerService";
import { GroupMembersServerService } from "@/lib/services/groupMembersServerService";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * POST /api/groups/[slug]/join — Join a group as a regular member.
 * Authentication required.
 */
export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const access = await GroupServerService.getGroupAccess(slug);
    if (!access) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (access.visibility === "private") {
      return NextResponse.json(
        { error: "Cannot join a private group directly" },
        { status: 403 }
      );
    }

    const existingRole = await GroupMembersServerService.getMemberRole(access.id, user.id);
    if (existingRole !== null) {
      return NextResponse.json({ error: "Already a member" }, { status: 409 });
    }

    await GroupMembersServerService.joinGroup(access.id, user.id);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    logger.error("Error in group join POST", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/groups/[slug]/join — Leave a group.
 * Authentication required. The owner cannot leave (must delete the group instead).
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const access = await GroupServerService.getGroupAccess(slug);
    if (!access) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (access.ownerId === user.id) {
      return NextResponse.json(
        { error: "The owner cannot leave the group. Delete it instead." },
        { status: 403 }
      );
    }

    await GroupMembersServerService.leaveGroup(access.id, user.id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error("Error in group join DELETE", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
