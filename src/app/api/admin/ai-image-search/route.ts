import { NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/auth-admin";

const requestSchema = z.object({
  characterName: z.string().min(1).max(255),
  gameNames: z.array(z.string().max(255)).optional(),
  imageType: z.enum(["main", "background"]),
});

const resultSchema = z.object({
  imageUrl: z.string(),
  source: z.string(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { characterName, gameNames, imageType } = parsed.data;
    const gamesContext =
      gameNames && gameNames.length > 0
        ? ` from the video game${gameNames.length > 1 ? "s" : ""} ${gameNames.join(", ")}`
        : "";
    const context = `${characterName}${gamesContext}`;

    const systemPrompt =
      imageType === "main"
        ? [
            "You are an expert at finding official character images from video games.",
            "Given a character name (and optionally a game name), return a direct URL to an official portrait/mugshot image of that character.",
            "Prefer high-quality images from official sources: game wikis (fandom.com, wiki), official game sites, or well-known gaming databases.",
            "The URL must point directly to an image file (ending in .png, .jpg, .jpeg, .webp, or served from an image CDN).",
            "If you cannot find a reliable image URL, return an empty string for imageUrl.",
            "For source, indicate where the image comes from (e.g. 'Final Fantasy Wiki', 'Nintendo Official').",
          ].join(" ")
        : [
            "You are an expert at finding background/wallpaper images for video game characters.",
            "Given a character name (and optionally a game name), return a direct URL to a wide/landscape background image featuring that character or their game environment.",
            "Prefer high-quality wallpapers, key art, or promotional images.",
            "The URL must point directly to an image file (ending in .png, .jpg, .jpeg, .webp, or served from an image CDN).",
            "If you cannot find a reliable image URL, return an empty string for imageUrl.",
            "For source, indicate where the image comes from.",
          ].join(" ");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    try {
      const { output } = await generateText({
        model: "openai/gpt-5.4-nano",
        output: Output.object({ schema: resultSchema }),
        system: systemPrompt,
        prompt: `Find an image for: ${context}`,
        abortSignal: controller.signal,
      });

      if (!output || !output.imageUrl) {
        return NextResponse.json({ imageUrl: null, source: null });
      }

      return NextResponse.json({
        imageUrl: output.imageUrl,
        source: output.source || null,
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error("AI image search failed", { error });
    return NextResponse.json({ error: "AI image search failed" }, { status: 500 });
  }
}
