/**
 * Admin API: Delete an IGDB webhook registration
 * DELETE /api/admin/webhooks/registrations/[id]
 */

import { NextResponse } from "next/server";
import { defineRoute, validationError } from "@/lib/api/route";
import { IGDBService } from "@/lib/services/igdbService";
import { logger } from "@/lib/logger";

export const DELETE = defineRoute({ auth: "admin" }, async ({ params }) => {
  const { id } = params;
  if (!id) {
    throw validationError(undefined, "Webhook ID required");
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
});
