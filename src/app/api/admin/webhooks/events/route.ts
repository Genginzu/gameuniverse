/**
 * Admin API: List IGDB webhook events
 * GET /api/admin/webhooks/events?entityType=games&eventType=update&status=received&page=1&limit=20
 */

import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { logger } from "@/lib/logger";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const eventType = searchParams.get("eventType");
    const status = searchParams.get("status");
    const notImported = searchParams.get("notImported") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10))
    );
    const offset = (page - 1) * limit;

    const supabase = await createRouteHandlerClient();

    // Build query with filters
    let query = (supabase as any)
      .from("igdb_webhook_events")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (entityType) query = query.eq("entity_type", entityType);
    if (eventType) query = query.eq("event_type", eventType);
    if (status) query = query.eq("status", status);
    if (notImported) query = query.is("game_id", null);

    const { data: events, count, error } = await query;

    if (error) {
      logger.error("Failed to fetch webhook events", { error });
      return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }

    // Enrich events with game/character names
    const enriched = await enrichEventsWithNames(supabase, events ?? []);

    return NextResponse.json({
      events: enriched,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    logger.error("Admin webhook events error", { error });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * Enrich webhook events with game/character names for display.
 */
async function enrichEventsWithNames(
  supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  events: Record<string, unknown>[]
) {
  if (events.length === 0) return [];

  const gameIds = events.map((e) => e.game_id).filter(Boolean) as string[];
  const characterIds = events.map((e) => e.character_id).filter(Boolean) as string[];

  // Fetch game names
  const gameMap = new Map<string, { name: string; slug: string }>();
  if (gameIds.length > 0) {
    const { data: games } = await supabase
      .from("games")
      .select("id, slug, game_translations(title)")
      .in("id", [...new Set(gameIds)]);

    for (const game of (games ?? []) as {
      id: string;
      slug: string;
      game_translations: { title: string }[];
    }[]) {
      const name = game.game_translations?.[0]?.title ?? game.slug;
      gameMap.set(game.id, { name, slug: game.slug });
    }
  }

  // Fetch character names
  const charMap = new Map<string, { name: string; slug: string }>();
  if (characterIds.length > 0) {
    const { data: characters } = await supabase
      .from("characters")
      .select("id, slug, character_translations(name)")
      .in("id", [...new Set(characterIds)]);

    for (const char of (characters ?? []) as {
      id: string;
      slug: string;
      character_translations: { name: string }[];
    }[]) {
      const name = char.character_translations?.[0]?.name ?? char.slug;
      charMap.set(char.id, { name, slug: char.slug });
    }
  }

  return events.map((event) => {
    const gameInfo = event.game_id ? gameMap.get(event.game_id as string) : null;
    const charInfo = event.character_id ? charMap.get(event.character_id as string) : null;

    // Fallback: extract name from webhook payload if game not in local DB
    const payloadName =
      !gameInfo && event.payload
        ? (((event.payload as Record<string, unknown>).name as string | undefined) ?? null)
        : null;

    return {
      ...event,
      game_name: gameInfo?.name ?? payloadName,
      game_slug: gameInfo?.slug ?? null,
      character_name: charInfo?.name ?? null,
      character_slug: charInfo?.slug ?? null,
    };
  });
}
