import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { generatePresignedUrl } from "@/lib/services/uploadService";
import { uploadRequestSchema } from "@/lib/validations/uploadValidation";
import { getExtensionFromMimeType } from "@/lib/utils/uploadUtils";
import { NextRequest, NextResponse } from "next/server";

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

  const result = uploadRequestSchema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid request body";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { context, contentType } = result.data;
  const extension = getExtensionFromMimeType(contentType);

  try {
    const { presignedUrl, publicUrl } = await generatePresignedUrl({
      context,
      userId: user.id,
      contentType,
      extension,
    });

    return NextResponse.json({ presignedUrl, publicUrl });
  } catch (error) {
    logger.error("Upload presigned URL generation failed", { error });
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }
}
