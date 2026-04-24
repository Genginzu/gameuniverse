import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

async function getUser(supabase: S) {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function isAdmin(supabase: S, userId: string) {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
  return data?.role === "admin";
}

/** GET /api/admin/disputes — Admin: list disputes */
export async function GET(request: NextRequest) {
  try {
    const supabase: S = await createRouteHandlerClient();
    const user = await getUser(supabase);
    if (!user || !(await isAdmin(supabase, user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const status = request.nextUrl.searchParams.get("status") || "open";

    let query = supabase
      .from("coaching_disputes")
      .select("id, session_id, reason, description, status, admin_notes, created_at, resolved_at, reporter:reporter_id(username, avatar_url), reported:reported_id(username, avatar_url)");

    if (status !== "all") query = query.eq("status", status);

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching disputes", { error });
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    const disputes = (data || []).map((d: S) => ({
      id: d.id, sessionId: d.session_id, reason: d.reason, description: d.description,
      status: d.status, adminNotes: d.admin_notes, createdAt: d.created_at, resolvedAt: d.resolved_at,
      reporter: { username: d.reporter?.username, avatarUrl: d.reporter?.avatar_url },
      reported: { username: d.reported?.username, avatarUrl: d.reported?.avatar_url },
    }));

    return NextResponse.json({ disputes });
  } catch (error) {
    logger.error("Error in disputes GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** POST /api/admin/disputes — User: create a dispute/report */
export async function POST(request: NextRequest) {
  try {
    const supabase: S = await createRouteHandlerClient();
    const user = await getUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sessionId, reportedId, reason, description } = await request.json();
    if (!reportedId || !reason) return NextResponse.json({ error: "reportedId and reason required" }, { status: 400 });

    const { data, error } = await supabase
      .from("coaching_disputes")
      .insert({ session_id: sessionId || null, reporter_id: user.id, reported_id: reportedId, reason, description: description || null })
      .select("id").single();

    if (error) {
      logger.error("Error creating dispute", { error });
      return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }

    return NextResponse.json({ dispute: data }, { status: 201 });
  } catch (error) {
    logger.error("Error in disputes POST", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
