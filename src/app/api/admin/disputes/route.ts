import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { defineRoute, forbidden, validationError } from "@/lib/api/route";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

const createDisputeSchema = z.looseObject({
  sessionId: z.unknown().optional(),
  reportedId: z.unknown().optional(),
  reason: z.unknown().optional(),
  description: z.unknown().optional(),
});

/**
 * GET /api/admin/disputes — Admin: list disputes.
 * coaching_disputes RLS only exposes a user's own disputes, so the admin check
 * runs first and the query uses the service-role client (issue #385).
 */
export const GET = defineRoute({ auth: "admin" }, async ({ request }) => {
  const supabase: S = getSupabaseAdmin();

  const status = request.nextUrl.searchParams.get("status") || "open";

  let query = supabase
    .from("coaching_disputes")
    .select(
      "id, session_id, reason, description, status, admin_notes, created_at, resolved_at, reporter:reporter_id(username, avatar_url), reported:reported_id(username, avatar_url)"
    );

  if (status !== "all") query = query.eq("status", status);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    logger.error("Error fetching disputes", { error });
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  const disputes = (data || []).map((d: S) => ({
    id: d.id,
    sessionId: d.session_id,
    reason: d.reason,
    description: d.description,
    status: d.status,
    adminNotes: d.admin_notes,
    createdAt: d.created_at,
    resolvedAt: d.resolved_at,
    reporter: { username: d.reporter?.username, avatarUrl: d.reporter?.avatar_url },
    reported: { username: d.reported?.username, avatarUrl: d.reported?.avatar_url },
  }));

  return NextResponse.json({ disputes });
});

/** POST /api/admin/disputes — User: create a dispute/report */
export const POST = defineRoute(
  { auth: "required", rateLimit: "report", body: createDisputeSchema },
  async ({ user, body }) => {
    const supabase: S = await createRouteHandlerClient();

    const { sessionId, reportedId, reason, description } = body;
    if (!sessionId || !reportedId || !reason)
      throw validationError(undefined, "sessionId, reportedId and reason required");

    // RLS (20261019000003) only accepts disputes about a session the reporter
    // took part in, against the other participant.
    const { data, error } = await supabase
      .from("coaching_disputes")
      .insert({
        session_id: sessionId,
        reporter_id: user.id,
        reported_id: reportedId,
        reason,
        description: description || null,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "42501") throw forbidden("Forbidden");
      logger.error("Error creating dispute", { error });
      return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }

    return NextResponse.json({ dispute: data }, { status: 201 });
  }
);
