import { NextResponse } from "next/server";
import { GroupInvitationsServerService } from "@/lib/services/groupInvitationsServerService";
import { conflict, defineRoute, forbidden, notFound } from "@/lib/api/route";

/** Maps the service's expected refusals to route errors; anything else stays a 500. */
function toRouteError(error: unknown): unknown {
  const message = error instanceof Error ? error.message : "";
  if (message === "Invitation not found") return notFound(message);
  if (message === "This invitation is not addressed to you") return forbidden(message);
  if (message === "This invitation has already been answered") return conflict(message);
  return error;
}

/**
 * POST /api/invitations/[token]/decline — Decline a group invitation.
 * Authentication required. The invitation must be addressed to the caller
 * and still pending.
 */
export const POST = defineRoute({ auth: "required" }, async ({ user, params }) => {
  try {
    await GroupInvitationsServerService.declineInvitation(params.token, user.id);
  } catch (error) {
    throw toRouteError(error);
  }

  return NextResponse.json({ success: true });
});
