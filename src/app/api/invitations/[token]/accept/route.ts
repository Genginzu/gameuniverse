import { NextResponse } from "next/server";
import { GroupInvitationsServerService } from "@/lib/services/groupInvitationsServerService";
import { conflict, defineRoute, forbidden, notFound } from "@/lib/api/route";

const CONFLICT_ERRORS = new Set([
  "This invitation has already been answered",
  "This invitation has expired",
  "This group has reached the maximum of 50 members",
]);

/** Maps the service's expected refusals to route errors; anything else stays a 500. */
function toRouteError(error: unknown): unknown {
  const message = error instanceof Error ? error.message : "";
  if (message === "Invitation not found") return notFound(message);
  if (message === "This invitation is not addressed to you") return forbidden(message);
  if (CONFLICT_ERRORS.has(message)) return conflict(message);
  return error;
}

/**
 * POST /api/invitations/[token]/accept — Accept a group invitation.
 * Authentication required. The invitation must be addressed to the caller,
 * still pending, not expired, and the group must not have reached 50 members.
 */
export const POST = defineRoute({ auth: "required" }, async ({ user, params }) => {
  try {
    await GroupInvitationsServerService.acceptInvitation(params.token, user.id);
  } catch (error) {
    throw toRouteError(error);
  }

  return NextResponse.json({ success: true });
});
