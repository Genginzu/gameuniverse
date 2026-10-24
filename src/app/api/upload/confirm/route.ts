import { NextResponse } from "next/server";

import { defineRoute, validationError } from "@/lib/api/route";
import { logger } from "@/lib/logger";
import { deleteFile } from "@/lib/services/uploadService";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { uploadConfirmSchema } from "@/lib/validations/uploadValidation";
import { getBucketName, isOwnedStorageUrl } from "@/lib/utils/uploadUtils";
import { CONTEXT_TO_PROFILE_FIELD } from "@/types/upload";

export const POST = defineRoute(
  { auth: "required", rateLimit: "upload", writesContent: true, body: uploadConfirmSchema },
  async ({ user, body }) => {
    const supabase = await createRouteHandlerClient();

    const { context, publicUrl } = body;
    const profileField = CONTEXT_TO_PROFILE_FIELD[context];
    const bucket = getBucketName(context);

    // The URL comes from the client: it must point to a file this user uploaded
    // in the matching bucket, otherwise it could reference (and later delete)
    // another user's file or an external tracking image.
    if (!isOwnedStorageUrl(publicUrl, bucket, user.id)) {
      throw validationError(undefined, "Invalid file URL");
    }

    // Get current profile to find old image URL
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("avatar_url, banner_url")
      .eq("id", user.id)
      .single();

    const oldUrl =
      (currentProfile as Record<string, string | null> | null)?.[profileField] ?? null;

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

    // Clean up old file (fire and forget). Legacy values may point elsewhere:
    // only delete files that belong to this user.
    if (oldUrl && oldUrl !== publicUrl && isOwnedStorageUrl(oldUrl, bucket, user.id)) {
      deleteFile(oldUrl).catch((err) => {
        logger.error("Failed to delete old file from storage", {
          error: err,
          oldUrl,
        });
      });
    }

    return NextResponse.json({ success: true, profile: updatedProfile });
  }
);
