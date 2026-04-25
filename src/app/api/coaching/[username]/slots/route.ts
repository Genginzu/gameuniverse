import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Missing or invalid date param (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const dayOfWeek = new Date(date).getUTCDay();

    const supabase: AnySupabase = await createRouteHandlerClient();

    // Join profiles -> coach_profiles -> coach_availabilities
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, coach_profiles(id)")
      .eq("username", username)
      .single();

    if (!profile?.coach_profiles?.[0]) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    const coachId = profile.coach_profiles[0].id;

    const { data, error } = await supabase
      .from("coach_availabilities")
      .select("*")
      .eq("coach_id", coachId)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true)
      .order("start_time");

    if (error) {
      logger.error("Error fetching coach slots", { error, username });
      return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 });
    }

    const slots = (data || []).map((row: AnySupabase) => ({
      id: row.id,
      dayOfWeek: row.day_of_week,
      startTime: row.start_time,
      endTime: row.end_time,
      timezone: row.timezone,
      isRecurring: row.is_recurring,
      specificDate: row.specific_date,
    }));

    return NextResponse.json({ slots, date, dayOfWeek });
  } catch (error) {
    logger.error("Error in coaching slots GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
