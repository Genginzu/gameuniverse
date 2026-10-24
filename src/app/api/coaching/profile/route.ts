import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { defineRoute, validationError } from "@/lib/api/route";
import { logger } from "@/lib/logger";
import * as coachProfileService from "@/lib/services/coachProfileService";

type CoachProfileUpdate = Parameters<typeof coachProfileService.update>[2];

const createProfileSchema = z.looseObject({
  bio: z.any().optional(),
  experience: z.any().optional(),
  languages: z.any().optional(),
});

// The whole body is forwarded to the service, which picks the known fields.
const updateProfileSchema = z.looseObject({});

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

export const POST = defineRoute(
  {
    auth: "required",
    rateLimit: "coachingProfile",
    writesContent: true,
    body: createProfileSchema,
  },
  async ({ user, body }) => {
    const supabase = await createRouteHandlerClient();
    const profile = await coachProfileService.create(supabase, user.id, {
      bio: body.bio,
      experience: body.experience,
      languages: body.languages,
    });

    return NextResponse.json({ profile }, { status: 201 });
  }
);

export const PATCH = defineRoute(
  {
    auth: "required",
    rateLimit: "coachingProfile",
    writesContent: true,
    body: updateProfileSchema,
  },
  async ({ user, body }) => {
    const supabase = await createRouteHandlerClient();
    try {
      const profile = await coachProfileService.update(
        supabase,
        user.id,
        body as CoachProfileUpdate
      );
      return NextResponse.json({ profile });
    } catch (error) {
      if ((error as { code?: string } | null)?.code === "22023") {
        throw validationError(undefined, "Invalid cancellation policy");
      }
      throw error;
    }
  }
);
