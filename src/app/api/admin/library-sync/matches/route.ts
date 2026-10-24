import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { defineRoute, notFound, validationError } from "@/lib/api/route";
import { GameImportService } from "@/lib/services/gameImportService";
import { backfillMatch } from "@/lib/services/librarySyncBackfill";
import { logger } from "@/lib/logger";

/** Linking may import a game from IGDB, which can take a few seconds. */
export const maxDuration = 60;

/**
 * Admin management of the shared platform → game match cache
 * (`platform_game_matches`). Lets an admin review titles reported by connected
 * platforms that couldn't be auto-matched to an IGDB game and link them
 * manually. Once linked, every player's next sync picks up the match.
 */

const PAGE_SIZE = 25;

interface MatchRow {
  platform: string;
  source_id: string;
  game_id: string | null;
  name: string | null;
  updated_at: string;
}

const linkMatchSchema = z.object({
  platform: z.string().optional(),
  sourceId: z.string().optional(),
  gameId: z.string().nullable().optional(),
  igdbId: z.number().nullable().optional(),
});

/**
 * GET /api/admin/library-sync/matches
 *   ?platform=steam|xbox|playstation
 *   &status=unmatched|matched|all   (default: unmatched)
 *   &search=<name>
 *   &page=1
 */
export const GET = defineRoute({ auth: "admin" }, async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform")?.trim() || null;
  const status = (searchParams.get("status") || "unmatched").toLowerCase();
  const search = searchParams.get("search")?.trim() || null;
  const locale = searchParams.get("locale") || "fr";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createRouteHandlerClient();
  const admin = getSupabaseAdmin();

  let query = admin
    .from("platform_game_matches")
    .select("platform, source_id, game_id, name, updated_at", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (platform) query = query.eq("platform", platform);
  if (status === "unmatched") query = query.is("game_id", null);
  else if (status === "matched") query = query.not("game_id", "is", null);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error, count } = await query;
  if (error) {
    logger.error("Failed to list platform matches", { error });
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  const rows = (data ?? []) as MatchRow[];

  // Resolve titles for matched rows.
  const gameIds = rows.map((r) => r.game_id).filter((id): id is string => !!id);
  const titleById = new Map<string, { title: string; slug: string }>();
  if (gameIds.length > 0) {
    const { data: games } = await supabase
      .from("games")
      .select("id, slug, game_translations(title, language_code)")
      .in("id", Array.from(new Set(gameIds)));
    for (const g of (games ?? []) as Array<{
      id: string;
      slug: string;
      game_translations: Array<{ title: string; language_code: string }> | null;
    }>) {
      const tr =
        g.game_translations?.find((t) => t.language_code === locale) ?? g.game_translations?.[0];
      titleById.set(g.id, { title: tr?.title ?? g.slug, slug: g.slug });
    }
  }

  const matches = rows.map((r) => ({
    platform: r.platform,
    sourceId: r.source_id,
    name: r.name,
    gameId: r.game_id,
    gameTitle: r.game_id ? (titleById.get(r.game_id)?.title ?? null) : null,
    gameSlug: r.game_id ? (titleById.get(r.game_id)?.slug ?? null) : null,
    updatedAt: r.updated_at,
  }));

  return NextResponse.json({
    matches,
    total: count ?? matches.length,
    page,
    pageSize: PAGE_SIZE,
  });
});

/**
 * PATCH /api/admin/library-sync/matches
 * Body: { platform, sourceId, gameId? , igdbId? }
 *   - gameId: link to an existing local game (null clears the link)
 *   - igdbId: link to an IGDB game, importing it locally first if needed
 *
 * Writes use the service role since `platform_game_matches` is
 * service-role-write-only.
 */
export const PATCH = defineRoute({ auth: "admin", body: linkMatchSchema }, async ({ body }) => {
  const { platform, sourceId, gameId, igdbId } = body;
  if (!platform || !sourceId) {
    throw validationError(undefined, "platform and sourceId are required");
  }

  const admin = getSupabaseAdmin();

  // Resolve the target local game id.
  let finalGameId: string | null = null;

  if (igdbId) {
    // Prefer an existing local game; import from IGDB otherwise.
    const { data: existing } = await admin
      .from("games")
      .select("id")
      .eq("igdb_id", igdbId)
      .maybeSingle();
    if (existing) {
      finalGameId = existing.id;
    } else {
      const result = await GameImportService.importFromIGDB(igdbId);
      if (!result.success) {
        return NextResponse.json({ error: result.error || "IGDB import failed" }, { status: 502 });
      }
      const { data: created } = await admin
        .from("games")
        .select("id")
        .eq("igdb_id", igdbId)
        .maybeSingle();
      if (!created) {
        return NextResponse.json({ error: "Imported game not found" }, { status: 500 });
      }
      finalGameId = created.id;
    }
  } else if (gameId) {
    const { data: game } = await admin.from("games").select("id").eq("id", gameId).maybeSingle();
    if (!game) throw notFound("Game not found");
    finalGameId = gameId;
  }
  // Neither igdbId nor gameId → clear the link (finalGameId stays null).

  const { error } = await admin
    .from("platform_game_matches")
    .update({ game_id: finalGameId, updated_at: new Date().toISOString() })
    .eq("platform", platform)
    .eq("source_id", sourceId);

  if (error) {
    logger.error("Failed to update platform match", { error, platform, sourceId });
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  // Immediately push the newly-linked game into the libraries of every user
  // who already reported this title.
  const backfilled = finalGameId ? await backfillMatch(admin, platform, sourceId, finalGameId) : 0;

  return NextResponse.json({ success: true, gameId: finalGameId, backfilled });
});
