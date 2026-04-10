import { NextResponse } from "next/server";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/auth-admin";

const requestSchema = z.object({
  characterName: z.string().min(1).max(255),
  gameNames: z.array(z.string().max(255)).optional(),
  imageType: z.enum(["main", "background"]),
});

const GOOGLE_CSE_API = "https://www.googleapis.com/customsearch/v1";

interface GoogleSearchItem {
  link: string;
  image?: { contextLink?: string };
  displayLink?: string;
}

/**
 * Build a Google-optimised search query for the character image.
 */
function buildQuery(
  characterName: string,
  gameNames: string[] | undefined,
  imageType: "main" | "background"
): string {
  const games = gameNames?.length ? gameNames.join(" ") : "";
  if (imageType === "main") {
    return `${characterName} ${games} video game character official portrait`.trim();
  }
  return `${characterName} ${games} video game wallpaper key art`.trim();
}

/**
 * Validate that a URL actually serves an image.
 */
async function isReachableImage(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5_000),
      redirect: "follow",
    });
    return res.ok && (res.headers.get("content-type") ?? "").startsWith("image/");
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { characterName, gameNames, imageType } = parsed.data;

    const apiKey = process.env.GOOGLE_CSE_API_KEY;
    const cx = process.env.GOOGLE_CSE_CX;

    if (!apiKey || !cx) {
      logger.error("Google CSE not configured — GOOGLE_CSE_API_KEY or GOOGLE_CSE_CX missing");
      return NextResponse.json({ error: "Image search not configured" }, { status: 503 });
    }

    const query = buildQuery(characterName, gameNames, imageType);
    const params = new URLSearchParams({
      key: apiKey,
      cx,
      q: query,
      searchType: "image",
      num: "5",
      safe: "active",
      imgType: imageType === "main" ? "photo" : "photo",
      imgSize: imageType === "main" ? "large" : "xlarge",
    });

    const res = await fetch(`${GOOGLE_CSE_API}?${params}`, {
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      logger.error("Google CSE request failed", { status: res.status, body: errBody });
      return NextResponse.json({ imageUrl: null, source: null });
    }

    const data = await res.json();
    const items: GoogleSearchItem[] = data.items ?? [];

    // Try each result until we find one that's actually reachable
    for (const item of items) {
      if (await isReachableImage(item.link)) {
        return NextResponse.json({
          imageUrl: item.link,
          source: item.displayLink || item.image?.contextLink || null,
        });
      }
    }

    // No valid image found
    return NextResponse.json({ imageUrl: null, source: null });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error("Image search failed", { error });
    return NextResponse.json({ error: "Image search failed" }, { status: 500 });
  }
}
