import { NextResponse } from "next/server";
import { z } from "zod";
import { defineRoute, notFound, validationError } from "@/lib/api/route";
import { NotificationServerService } from "@/lib/services/notificationServerService";

const readStatusSchema = z.looseObject({ isRead: z.unknown().optional() });

/**
 * PATCH /api/notifications/[id] — Toggle the read status of a single notification.
 * Body: `{ isRead: boolean }`.
 */
export const PATCH = defineRoute(
  { auth: "required", body: readStatusSchema },
  async ({ user, params, body }) => {
    if (typeof body.isRead !== "boolean") {
      throw validationError(undefined, "isRead (boolean) is required");
    }

    const { id } = params;
    const success = await NotificationServerService.setReadStatus(id, user.id, body.isRead);

    if (!success) throw notFound("Notification not found");

    return NextResponse.json({ success: true });
  }
);
