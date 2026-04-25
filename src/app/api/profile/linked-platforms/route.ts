import { createRouteHandlerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import {
  getLinkedPlatforms,
  upsertManualPlatform,
  deleteLinkedPlatform,
  setPlatformVisibility,
} from "@/lib/services/linkedPlatformService";
import {
  validateManualUsername,
  ManualPlatformValidationError,
} from "@/lib/services/manualPlatformValidation";
import { GAMING_PLATFORMS, PLATFORM_META, type GamingPlatform } from "@/types/linked-platforms";

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

/** PUT — only for manual (pseudo) platforms */
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

    // Only allow manual platforms through this endpoint
    const meta = PLATFORM_META[platform as GamingPlatform];
    if (meta.authType !== "manual") {
      return NextResponse.json({ error: "Use OAuth flow for this platform" }, { status: 400 });
    }

    if (!platformUsername?.trim()) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    let normalized: string;
    try {
      normalized = await validateManualUsername(platform as GamingPlatform, platformUsername);
    } catch (err) {
      if (err instanceof ManualPlatformValidationError) {
        return NextResponse.json({ error: "Invalid username", code: err.code }, { status: 400 });
      }
      throw err;
    }

    const result = await upsertManualPlatform(supabase, user.id, platform, normalized);
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Failed to upsert linked platform", { error });
    return NextResponse.json({ error: "Failed to save platform" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { platform, isPublic } = await request.json();
    if (!platform || !GAMING_PLATFORMS.includes(platform as GamingPlatform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }
    if (typeof isPublic !== "boolean") {
      return NextResponse.json({ error: "isPublic must be boolean" }, { status: 400 });
    }

    await setPlatformVisibility(supabase, user.id, platform, isPublic);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to update platform visibility", { error });
    return NextResponse.json({ error: "Failed to update visibility" }, { status: 500 });
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
