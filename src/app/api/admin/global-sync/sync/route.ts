import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { IGDBService } from "@/lib/services/igdbService";
import { logger } from "@/lib/logger";

const BATCH_SIZE = 3;

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
    if (!igdb) {
      // Game was deleted/merged on IGDB — remove from sync table
      logger.warn("Game not found on IGDB, removing from global sync", {
        igdbId: entry.igdb_id,
        name: entry.name,
      });
      await supabase.from("igdb_global_sync").delete().eq("id", entry.id);
      return { ...base, success: false, error: "Not found on IGDB (removed)" };
    }

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

  const slugs = genres.map((g) => g.slug);
  const { data: existing } = await supabase.from("genres").select("id, slug").in("slug", slugs);

  const idBySlug = new Map<string, string>();
  for (const row of existing || []) idBySlug.set(row.slug, row.id);

  const missing = genres.filter((g) => !idBySlug.has(g.slug));
  if (missing.length > 0) {
    const { data: created } = await supabase
      .from("genres")
      .insert(missing.map((g) => ({ slug: g.slug })))
      .select("id, slug");

    for (const row of created || []) idBySlug.set(row.slug, row.id);

    const translations = (created || [])
      .map((row: { id: string; slug: string }) => {
        const src = missing.find((g) => g.slug === row.slug);
        return src ? { genre_id: row.id, language_code: "en", name: src.name } : null;
      })
      .filter(Boolean);

    if (translations.length > 0) {
      await supabase.from("genre_translations").insert(translations);
    }
  }

  const rows = genres
    .map((g) => idBySlug.get(g.slug))
    .filter((id): id is string => Boolean(id))
    .map((genre_id) => ({ game_id: gameId, genre_id }));

  if (rows.length > 0) await supabase.from("game_genres").insert(rows);
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

  const uniqueBySlug = new Map<string, { id: number; name: string; slug: string }>();
  for (const ic of companies) uniqueBySlug.set(ic.company.slug, ic.company);
  const slugs = [...uniqueBySlug.keys()];

  const { data: existing } = await supabase
    .from("companies")
    .select("id, slug")
    .in("slug", slugs);

  const idBySlug = new Map<string, string>();
  for (const row of existing || []) idBySlug.set(row.slug, row.id);

  const missing = [...uniqueBySlug.values()].filter((c) => !idBySlug.has(c.slug));
  if (missing.length > 0) {
    const { data: created } = await supabase
      .from("companies")
      .insert(missing.map((c) => ({ name: c.name, slug: c.slug })))
      .select("id, slug");

    for (const row of created || []) idBySlug.set(row.slug, row.id);
  }

  const rows: Array<{ game_id: string; company_id: string; role: string; is_primary: boolean }> =
    [];
  let devIdx = 0,
    pubIdx = 0;

  for (const ic of companies) {
    const cid = idBySlug.get(ic.company.slug);
    if (!cid) continue;
    if (ic.developer)
      rows.push({ game_id: gameId, company_id: cid, role: "developer", is_primary: devIdx++ === 0 });
    if (ic.publisher)
      rows.push({ game_id: gameId, company_id: cid, role: "publisher", is_primary: pubIdx++ === 0 });
  }

  if (rows.length > 0) await supabase.from("game_companies").insert(rows);
}

async function linkPlatformsBatch(
  supabase: SupabaseAdmin,
  gameId: string,
  platforms: Array<{ id: number; name: string }>
) {
  if (platforms.length === 0) return;

  const igdbIds = platforms.map((p) => p.id);
  const { data: existing } = await supabase
    .from("platforms")
    .select("id, igdb_id")
    .in("igdb_id", igdbIds);

  const idByIgdbId = new Map<number, string>();
  for (const row of existing || []) idByIgdbId.set(row.igdb_id, row.id);

  const missing = platforms.filter((p) => !idByIgdbId.has(p.id));
  if (missing.length > 0) {
    const newRows = missing.map((p) => {
      const name = p.name || `platform-${p.id}`;
      const slug = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-");
      return { slug, igdb_id: p.id };
    });

    const { data: created } = await supabase
      .from("platforms")
      .insert(newRows)
      .select("id, igdb_id");

    for (const row of created || []) idByIgdbId.set(row.igdb_id, row.id);

    const translations = (created || [])
      .map((row: { id: string; igdb_id: number }) => {
        const src = missing.find((p) => p.id === row.igdb_id);
        if (!src) return null;
        const name = src.name || `platform-${src.id}`;
        return { platform_id: row.id, language_code: "en", name };
      })
      .filter(Boolean);

    if (translations.length > 0) {
      await supabase.from("platform_translations").insert(translations);
    }
  }

  const rows = platforms
    .map((p) => idByIgdbId.get(p.id))
    .filter((id): id is string => Boolean(id))
    .map((platform_id) => ({ game_id: gameId, platform_id }));

  if (rows.length > 0) await supabase.from("game_platforms").insert(rows);
}
