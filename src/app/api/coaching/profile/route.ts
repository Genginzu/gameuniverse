import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import * as coachProfileService from "@/lib/services/coachProfileService";

export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await coachProfileService.getByPlayerId(supabase, user.id);
    return NextResponse.json({ profile });
  } catch (error) {
    logger.error("Error in coaching profile GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const profile = await coachProfileService.create(supabase, user.id, {
      bio: body.bio,
      experience: body.experience,
      languages: body.languages,
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    logger.error("Error in coaching profile POST", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const profile = await coachProfileService.update(supabase, user.id, body);

    return NextResponse.json({ profile });
  } catch (error) {
    logger.error("Error in coaching profile PATCH", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
