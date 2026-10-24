import { logger } from "@/lib/logger";
import { generateSignedUploadUrl } from "@/lib/services/uploadService";
import { uploadRequestSchema } from "@/lib/validations/uploadValidation";
import { getExtensionFromMimeType } from "@/lib/utils/uploadUtils";
import { NextResponse } from "next/server";
import { defineRoute } from "@/lib/api/route";

export const POST = defineRoute(
  { auth: "required", rateLimit: "upload", body: uploadRequestSchema },
  async ({ user, body }) => {
    const { context, contentType } = body;
    const extension = getExtensionFromMimeType(contentType);

    try {
      const { signedUrl, publicUrl } = await generateSignedUploadUrl({
        context,
        userId: user.id,
        contentType,
        extension,
      });

      return NextResponse.json({ signedUrl, publicUrl });
    } catch (error) {
      logger.error("Upload signed URL generation failed", { error });
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }
  }
);
