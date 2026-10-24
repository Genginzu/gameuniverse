import { createRouteHandlerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { defineRoute, validationError } from "@/lib/api/route";
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

const platformBodySchema = z.looseObject({
  platform: z.unknown().optional(),
  platformUsername: z.unknown().optional(),
  isPublic: z.unknown().optional(),
});

function assertPlatform(platform: unknown): asserts platform is GamingPlatform {
  if (!platform || !GAMING_PLATFORMS.includes(platform as GamingPlatform)) {
    throw validationError(undefined, "Invalid platform");
  }
}

export const GET = defineRoute({ auth: "required" }, async ({ user }) => {
  const supabase = await createRouteHandlerClient();
  const platforms = await getLinkedPlatforms(supabase, user.id);
  return NextResponse.json(platforms);
});

/** PUT — only for manual (pseudo) platforms */
export const PUT = defineRoute(
  { auth: "required", rateLimit: "platformLink", body: platformBodySchema },
  async ({ user, body }) => {
    const supabase = await createRouteHandlerClient();
    const { platform, platformUsername } = body;

    assertPlatform(platform);

    // Only allow manual platforms through this endpoint
    const meta = PLATFORM_META[platform];
    if (meta.authType !== "manual") {
      throw validationError(undefined, "Use OAuth flow for this platform");
    }

    if (typeof platformUsername !== "string" || !platformUsername.trim()) {
      throw validationError(undefined, "Username is required");
    }

    let normalized: string;
    try {
      normalized = await validateManualUsername(platform, platformUsername);
    } catch (err) {
      if (err instanceof ManualPlatformValidationError) {
        return NextResponse.json({ error: "Invalid username", code: err.code }, { status: 400 });
      }
      throw err;
    }

    const result = await upsertManualPlatform(supabase, user.id, platform, normalized);
    return NextResponse.json(result);
  }
);

export const PATCH = defineRoute(
  { auth: "required", body: platformBodySchema },
  async ({ user, body }) => {
    const supabase = await createRouteHandlerClient();
    const { platform, isPublic } = body;

    assertPlatform(platform);
    if (typeof isPublic !== "boolean") {
      throw validationError(undefined, "isPublic must be boolean");
    }

    await setPlatformVisibility(supabase, user.id, platform, isPublic);
    return NextResponse.json({ success: true });
  }
);

export const DELETE = defineRoute(
  { auth: "required", body: platformBodySchema },
  async ({ user, body }) => {
    const supabase = await createRouteHandlerClient();
    const { platform } = body;

    assertPlatform(platform);

    await deleteLinkedPlatform(supabase, user.id, platform);
    return NextResponse.json({ success: true });
  }
);
