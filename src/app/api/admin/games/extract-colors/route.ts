import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { extractColorsFromCover } from "@/lib/utils/color-extraction";

/**
 * POST /api/admin/games/extract-colors
 * Body: { coverUrl: string }
 * Returns extracted colors from the cover image.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { coverUrl } = await request.json();
    if (!coverUrl) {
      return NextResponse.json({ error: "coverUrl is required" }, { status: 400 });
    }
    const colors = await extractColorsFromCover(coverUrl);
    if (!colors) {
      return NextResponse.json({ error: "Failed to extract colors" }, { status: 422 });
    }
    return NextResponse.json(colors);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
}
