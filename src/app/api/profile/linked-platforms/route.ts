import { createRouteHandlerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import {
  getLinkedPlatforms,
  upsertLinkedPlatform,
  deleteLinkedPlatform,
} from "@/lib/services/linkedPlatformService";
import { GAMING_PLATFORMS, type GamingPlatform } from "@/types/linked-platforms";

export async function GET() {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const platforms = await getLinkedPlatforms(supabase, user.id);
    return NextResponse.json(platforms);
  } catch (error) {
    logger.error("Failed to fetch linked platforms", { error });
    return NextResponse.json({ error: "Failed to fetch linked platforms" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { platform, platformUsername } = await request.json();

    if (!platform || !GAMING_PLATFORMS.includes(platform as GamingPlatform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }
    if (!platformUsername?.trim()) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const result = await upsertLinkedPlatform(supabase, user.id, platform, platformUsername);
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Failed to upsert linked platform", { error });
    return NextResponse.json({ error: "Failed to save platform" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { platform } = await request.json();

    if (!platform || !GAMING_PLATFORMS.includes(platform as GamingPlatform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    await deleteLinkedPlatform(supabase, user.id, platform);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete linked platform", { error });
    return NextResponse.json({ error: "Failed to delete platform" }, { status: 500 });
  }
}
