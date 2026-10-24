import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { defineRoute, notFound, validationError } from "@/lib/api/route";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

const availabilityBodySchema = z.looseObject({
  dayOfWeek: z.unknown().optional(),
  startTime: z.unknown().optional(),
  endTime: z.unknown().optional(),
  timezone: z.unknown().optional(),
  isRecurring: z.unknown().optional(),
  specificDate: z.unknown().optional(),
});

export async function GET() {
  try {
    const supabase: AnySupabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("coach_profiles")
      .select("id")
      .eq("player_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ availabilities: [] });
    }

    const { data, error } = await supabase
      .from("coach_availabilities")
      .select("*")
      .eq("coach_id", profile.id)
      .order("day_of_week")
      .order("start_time");

    if (error) {
      logger.error("Error fetching coach availabilities", { error });
      return NextResponse.json({ error: "Failed to fetch availabilities" }, { status: 500 });
    }

    const availabilities = (data || []).map((row: AnySupabase) => ({
      id: row.id,
      coachId: row.coach_id,
      dayOfWeek: row.day_of_week,
      startTime: row.start_time,
      endTime: row.end_time,
      timezone: row.timezone,
      isRecurring: row.is_recurring,
      specificDate: row.specific_date,
      isActive: row.is_active,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ availabilities });
  } catch (error) {
    logger.error("Error in coaching availability GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const POST = defineRoute(
  { auth: "required", rateLimit: "coachingProfile", body: availabilityBodySchema },
  async ({ user, body }) => {
    const supabase: AnySupabase = await createRouteHandlerClient();

    const { data: profile } = await supabase
      .from("coach_profiles")
      .select("id")
      .eq("player_id", user.id)
      .single();

    if (!profile) throw notFound("Coach profile not found");

    const { dayOfWeek, startTime, endTime, timezone, isRecurring, specificDate } = body;

    if (dayOfWeek === undefined || dayOfWeek === null || !startTime || !endTime) {
      throw validationError(undefined, "Missing required fields");
    }

    const { data, error } = await supabase
      .from("coach_availabilities")
      .insert({
        coach_id: profile.id,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        timezone: timezone ?? "Europe/Paris",
        is_recurring: isRecurring ?? true,
        specific_date: specificDate ?? null,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error creating coach availability", { error });
      return NextResponse.json({ error: "Failed to create availability" }, { status: 500 });
    }

    return NextResponse.json(
      {
        availability: {
          id: data.id,
          coachId: data.coach_id,
          dayOfWeek: data.day_of_week,
          startTime: data.start_time,
          endTime: data.end_time,
          timezone: data.timezone,
          isRecurring: data.is_recurring,
          specificDate: data.specific_date,
          isActive: data.is_active,
          createdAt: data.created_at,
        },
      },
      { status: 201 }
    );
  }
);
