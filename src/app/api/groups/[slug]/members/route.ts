import { NextRequest, NextResponse } from "next/server";
import { GroupServerService } from "@/lib/services/groupServerService";
import { GroupMembersServerService } from "@/lib/services/groupMembersServerService";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * GET /api/groups/[slug]/members — List members of a group.
 * Access follows the group's RLS visibility (public groups: anyone; private: members only,
 * enforced at the DB level by group_members RLS policies).
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;

    const access = await GroupServerService.getGroupAccess(slug);
    if (!access) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const members = await GroupMembersServerService.fetchMembers(access.id);

    return NextResponse.json({ members });
  } catch (error) {
    logger.error("Error in group members GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
