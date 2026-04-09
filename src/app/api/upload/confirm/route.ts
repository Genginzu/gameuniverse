import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { deleteFile } from "@/lib/services/uploadService";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { uploadConfirmSchema } from "@/lib/validations/uploadValidation";
import { CONTEXT_TO_PROFILE_FIELD } from "@/types/upload";

export async function POST(request: NextRequest) {
  const supabase = await createRouteHandlerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = uploadConfirmSchema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid request body";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { context, publicUrl } = result.data;
  const profileField = CONTEXT_TO_PROFILE_FIELD[context];

  // Get current profile to find old image URL
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("avatar_url, banner_url")
    .eq("id", user.id)
    .single();

  const oldUrl = (currentProfile as Record<string, string | null> | null)?.[profileField] ?? null;

  // Update the profile field
  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update({
      [profileField]: publicUrl,
      updated_at: new Date().toISOString(),
    } as unknown as Record<string, never>)
    .eq("id", user.id)
    .select()
    .single();

  if (updateError) {
    logger.error("Profile update failed, rolling back storage upload", {
      error: updateError,
      userId: user.id,
      context,
    });

    // Rollback: delete the newly uploaded file
    try {
      await deleteFile(publicUrl);
    } catch (rollbackError) {
      logger.error("Rollback storage delete also failed", { error: rollbackError });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  // Clean up old file (fire and forget)
  if (oldUrl && oldUrl !== publicUrl) {
    deleteFile(oldUrl).catch((err) => {
      logger.error("Failed to delete old file from storage", {
        error: err,
        oldUrl,
      });
    });
  }

  return NextResponse.json({ success: true, profile: updatedProfile });
}
