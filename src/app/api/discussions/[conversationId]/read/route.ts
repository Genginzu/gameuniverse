import { NextResponse } from "next/server";
import { DiscussionServerService } from "@/lib/services/discussionServerService";
import { defineRoute, notFound } from "@/lib/api/route";

/**
 * PATCH /api/discussions/[conversationId]/read — Mark messages as read.
 */
export const PATCH = defineRoute({ auth: "required" }, async ({ user, params }) => {
  try {
    await DiscussionServerService.markAsRead(params.conversationId, user.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "Conversation not found") throw notFound(message);
    throw error;
  }
  return NextResponse.json({ success: true });
});
