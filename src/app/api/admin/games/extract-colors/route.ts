import { NextResponse } from "next/server";
import { z } from "zod";
import { defineRoute } from "@/lib/api/route";
import { extractColorsFromCover } from "@/lib/utils/color-extraction";

const extractColorsSchema = z.object({
  coverUrl: z.string().min(1),
  variant: z.number().optional(),
});

/**
 * POST /api/admin/games/extract-colors
 * Body: { coverUrl: string, variant?: number }
 * variant 0 = default (most vibrant), 1 = 2nd most vibrant, etc.
 */
export const POST = defineRoute({ auth: "admin", body: extractColorsSchema }, async ({ body }) => {
  const { coverUrl, variant } = body;
  const colors = await extractColorsFromCover(coverUrl, false, variant ?? 0);
  if (!colors) {
    return NextResponse.json({ error: "Failed to extract colors" }, { status: 422 });
  }
  return NextResponse.json(colors);
});
