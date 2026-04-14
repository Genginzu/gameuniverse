import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { IGDBService } from "@/lib/services/igdbService";
import { logger } from "@/lib/logger";

const BATCH_SIZE = 5;

/**
 * POST /api/admin/global-sync/sync
 * Phase 1: Lightweight import — game + translation + genres/companies/platforms.
 * No color extraction, no screenshots/artworks/videos/age ratings.
 * Processes 5 games in parallel per request.
 */
export async function POST(_request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();

    const { data: entries, error: fetchError } = await supabase
      .from("igdb_global_sync")
      .select("id, igdb_id, name, cover_image_id")
      .eq("is_synced", false)
      .order("igdb_id", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      logger.error("Error fetching unsynced games", { fetchError });
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({ results: [], done: true, remaining: 0 });
    }

    const results = await Promise.all(entries.map((e) => syncOneGame(supabase, e)));

    const { count: remaining } = await supabase
      .from("igdb_global_sync")
      .select("id", { count: "exact", head: true })
      .eq("is_synced", false);

    return NextResponse.json({ results, done: false, remaining: remaining ?? 0 });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    logger.error("Error in global-sync sync", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

interface SyncEntry {
  id: number;
  igdb_id: number;
  name: string;
  cover_image_id: string | null;
}

interface SyncResult {
  success: boolean;
  igdbId: number;
  name: string;
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdmin = any;

async function syncOneGame(supabase: SupabaseAdmin, entry: SyncEntry): Promise<SyncResult> {
  const base = { igdbId: entry.igdb_id, name: entry.name };
  try {
    // Skip if already in our DB
    const { data: existing } = await supabase
      .from("games")
      .select("id")
      .eq("igdb_id", entry.igdb_id)
      .single();

    if (existing) {
      await markSynced(supabase, entry.id, existing.id);
      return { ...base, success: true };
    }

    // Single IGDB call — gets everything
    const igdb = await IGDBService.getGameDetails(entry.igdb_id);
    if (!igdb) return { ...base, success: false, error: "Not found on IGDB" };

    // Build cover/background URLs
    const coverUrl = igdb.cover?.image_id
      ? IGDBService.buildImageUrl(igdb.cover.image_id, "cover_big")
      : null;
    let bgUrl: string | null = null;
    if (igdb.artworks?.[0]?.image_id) {
      bgUrl = IGDBService.buildImageUrl(igdb.artworks[0].image_id, "1080p");
    } else if (igdb.screenshots?.[0]?.image_id) {
      bgUrl = IGDBService.buildImageUrl(igdb.screenshots[0].image_id, "1080p");
    }

    const releaseDate = igdb.first_release_date
      ? new Date(igdb.first_release_date * 1000).toISOString().split("T")[0]
      : null;
    const metascore = igdb.aggregated_rating ? Math.round(igdb.aggregated_rating) : null;

    // Upsert game (handles retries and slug conflicts)
    const { data: newGame, error: insertErr } = await supabase
      .from("games")
      .upsert(
        {
          slug: igdb.slug,
          igdb_id: igdb.id,
          release_date: releaseDate,
          metascore,
          cover_image_url: coverUrl,
          background_image_url: bgUrl,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: "igdb_id" }
      )
      .select("id")
      .single();

    if (insertErr || !newGame) {
      return { ...base, success: false, error: insertErr?.message ?? "Insert failed" };
    }

    const gameId = newGame.id as string;

    // All DB writes in parallel — no dependencies between them
    await Promise.all([
      upsertTranslation(supabase, gameId, igdb.name, igdb.summary || null),
      linkGenresBatch(supabase, gameId, igdb.genres || []),
      linkCompaniesBatch(supabase, gameId, igdb.involved_companies || []),
      linkPlatformsBatch(supabase, gameId, igdb.platforms || []),
    ]);

    await markSynced(supabase, entry.id, gameId);
    return { ...base, success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.warn("Global sync failed", { igdbId: entry.igdb_id, error: msg });

    // Check if the game was partially created — if so, mark as synced
    // so we don't lose track of it
    const { data: partialGame } = await supabase
      .from("games")
      .select("id")
      .eq("igdb_id", entry.igdb_id)
      .single();

    if (partialGame) {
      await markSynced(supabase, entry.id, partialGame.id);
    }

    return { ...base, success: false, error: msg };
  }
}

async function markSynced(supabase: SupabaseAdmin, syncId: number, gameId: string) {
  await supabase
    .from("igdb_global_sync")
    .update({ is_synced: true, matched_game_id: gameId })
    .eq("id", syncId);
}

async function upsertTranslation(
  supabase: SupabaseAdmin,
  gameId: string,
  title: string,
  description: string | null
) {
  await supabase
    .from("game_translations")
    .upsert(
      { game_id: gameId, language_code: "en", title, description },
      { onConflict: "game_id,language_code" }
    );
}

async function linkGenresBatch(
  supabase: SupabaseAdmin,
  gameId: string,
  genres: Array<{ id: number; name: string; slug: string }>
) {
  if (genres.length === 0) return;
  const ids = await Promise.all(genres.map((g) => ensureGenre(supabase, g)));
  const rows = ids.filter(Boolean).map((gid) => ({ game_id: gameId, genre_id: gid }));
  if (rows.length > 0) await supabase.from("game_genres").insert(rows);
}

async function ensureGenre(
  supabase: SupabaseAdmin,
  genre: { slug: string; name: string }
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("genres")
    .select("id")
    .eq("slug", genre.slug)
    .single();
  if (existing) return existing.id;

  const { data: created } = await supabase
    .from("genres")
    .insert({ slug: genre.slug })
    .select("id")
    .single();
  if (!created) return null;

  await supabase
    .from("genre_translations")
    .insert({ genre_id: created.id, language_code: "en", name: genre.name });
  return created.id;
}

async function linkCompaniesBatch(
  supabase: SupabaseAdmin,
  gameId: string,
  companies: Array<{
    company: { id: number; name: string; slug: string };
    developer: boolean;
    publisher: boolean;
  }>
) {
  if (companies.length === 0) return;
  const rows: Array<{ game_id: string; company_id: string; role: string; is_primary: boolean }> =
    [];
  let devIdx = 0,
    pubIdx = 0;

  for (const ic of companies) {
    const cid = await ensureCompany(supabase, ic.company);
    if (!cid) continue;
    if (ic.developer)
      rows.push({
        game_id: gameId,
        company_id: cid,
        role: "developer",
        is_primary: devIdx++ === 0,
      });
    if (ic.publisher)
      rows.push({
        game_id: gameId,
        company_id: cid,
        role: "publisher",
        is_primary: pubIdx++ === 0,
      });
  }
  if (rows.length > 0) await supabase.from("game_companies").insert(rows);
}

async function ensureCompany(
  supabase: SupabaseAdmin,
  company: { name: string; slug: string }
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("companies")
    .select("id")
    .eq("slug", company.slug)
    .single();
  if (existing) return existing.id;

  const { data: created } = await supabase
    .from("companies")
    .insert({ name: company.name, slug: company.slug })
    .select("id")
    .single();
  return created?.id ?? null;
}

async function linkPlatformsBatch(
  supabase: SupabaseAdmin,
  gameId: string,
  platforms: Array<{ id: number; name: string }>
) {
  if (platforms.length === 0) return;
  const ids = await Promise.all(platforms.map((p) => ensurePlatform(supabase, p)));
  const rows = ids.filter(Boolean).map((pid) => ({ game_id: gameId, platform_id: pid }));
  if (rows.length > 0) await supabase.from("game_platforms").insert(rows);
}

async function ensurePlatform(
  supabase: SupabaseAdmin,
  platform: { id: number; name: string }
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("platforms")
    .select("id")
    .eq("igdb_id", platform.id)
    .single();
  if (existing) return existing.id;

  const name = platform.name || `platform-${platform.id}`;
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");

  const { data: created } = await supabase
    .from("platforms")
    .insert({ slug, igdb_id: platform.id })
    .select("id")
    .single();
  if (!created) return null;

  await supabase
    .from("platform_translations")
    .insert({ platform_id: created.id, language_code: "en", name });
  return created.id;
}
