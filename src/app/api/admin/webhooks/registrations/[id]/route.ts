/**
 * Admin API: Delete an IGDB webhook registration
 * DELETE /api/admin/webhooks/registrations/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { IGDBService } from "@/lib/services/igdbService";
import { logger } from "@/lib/logger";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Webhook ID required" }, { status: 400 });
    }

    const token = await IGDBService.getAccessToken();
    const clientId = process.env.IGDB_CLIENT_ID!;

    const response = await fetch(`https://api.igdb.com/v4/webhooks/${id}`, {
      method: "DELETE",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error("Failed to delete IGDB webhook", { status: response.status, body: text });
      return NextResponse.json({ error: "Failed to delete webhook from IGDB" }, { status: 502 });
    }

    logger.info("IGDB webhook deleted", { webhookId: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    logger.error("Delete webhook error", { error });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
