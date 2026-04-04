/**
 * Admin API: Compute diff between a webhook event payload and local DB data.
 * GET /api/admin/webhooks/events/[eventId]/diff
 */

import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { logger } from "@/lib/logger";
import type { DiffField, DiffFieldStatus, WebhookDiffResult } from "@/types/webhook-diff";
import {
  igdbCoverUrl,
  igdb1080pUrl,
  unixToDate,
  normalizeDate,
  sorted,
  fetchLocalGenres,
  fetchLocalPlatforms,
  fetchLocalCompanies,
  fetchLocalScreenshots,
  fetchLocalArtworks,
  fetchLocalVideos,
  fetchLocalSimilarGamesCount,
} from "@/lib/services/webhook-diff-helpers";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { eventId } = await params;
    const supabase = await createRouteHandlerClient();

    // Fetch the webhook event
    const { data: event, error: eventError } = await supabase
      .from("igdb_webhook_events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.event_type !== "update") {
      return NextResponse.json(
        { error: "Diff is only available for update events" },
        { status: 400 }
      );
    }
    if (!event.game_id) {
      return NextResponse.json({ error: "No local game linked to this event" }, { status: 400 });
    }

    const gameId = event.game_id as string;

    // Fetch local game data with EN translation
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("*, game_translations(title, description, storyline, language_code)")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const translations = (game.game_translations ?? []) as Array<{
      title: string;
      description: string | null;
      storyline: string | null;
      language_code: string;
    }>;
    const enTrans = translations.find((t) => t.language_code === "en");

    // Fetch admin overrides
    const { data: overrides } = await supabase
      .from("game_field_overrides")
      .select("field_name")
      .eq("game_id", gameId);
    const overrideSet = new Set((overrides ?? []).map((o) => o.field_name as string));

    // Fetch relational data in parallel
    const [
      localGenres,
      localPlatforms,
      localCompanies,
      localScreenshots,
      localArtworks,
      localVideos,
      localSimilarCount,
    ] = await Promise.all([
      fetchLocalGenres(supabase, gameId),
      fetchLocalPlatforms(supabase, gameId),
      fetchLocalCompanies(supabase, gameId),
      fetchLocalScreenshots(supabase, gameId),
      fetchLocalArtworks(supabase, gameId),
      fetchLocalVideos(supabase, gameId),
      fetchLocalSimilarGamesCount(supabase, gameId),
    ]);

    const payload = event.payload as Record<string, unknown>;
    const gameName = enTrans?.title ?? (game.slug as string) ?? "Unknown";
    const fields: DiffField[] = [];

    const add = (
      field: string,
      label: string,
      igdbValue: unknown,
      localValue: unknown,
      overrideField?: string
    ) => {
      const hasOverride = overrideField ? overrideSet.has(overrideField) : false;
      const valuesEqual = JSON.stringify(igdbValue) === JSON.stringify(localValue);
      let status: DiffFieldStatus = "unchanged";
      if (!valuesEqual) status = hasOverride ? "conflict" : "changed";
      fields.push({ field, label, igdbValue, localValue, status, hasOverride });
    };

    // --- Direct fields ---
    add("name", "fields.name", payload.name ?? null, enTrans?.title ?? null, "translations");
    add(
      "summary",
      "fields.summary",
      payload.summary ?? null,
      enTrans?.description ?? null,
      "translations"
    );
    add(
      "storyline",
      "fields.storyline",
      payload.storyline ?? null,
      enTrans?.storyline ?? null,
      "translations"
    );
    add("slug", "fields.slug", payload.slug ?? null, game.slug ?? null);

    const igdbDate = payload.first_release_date
      ? unixToDate(payload.first_release_date as number)
      : null;
    const localDate = game.release_date ? normalizeDate(game.release_date as string) : null;
    add("release_date", "fields.releaseDate", igdbDate, localDate, "release_date");

    add(
      "metascore",
      "fields.metascore",
      payload.aggregated_rating ? Math.round(payload.aggregated_rating as number) : null,
      game.metascore ?? null,
      "metascore"
    );

    const cover = payload.cover as { image_id?: string } | number | undefined;
    const coverImageId = typeof cover === "number" ? null : cover?.image_id;
    add(
      "cover_image",
      "fields.coverImage",
      coverImageId ? igdbCoverUrl(coverImageId) : null,
      game.cover_image_url ?? null,
      "cover_image"
    );

    // Background image (derived from artworks/screenshots)
    // Webhook sends raw ID arrays, API sends objects — handle both
    const rawArtworks = payload.artworks as Array<{ image_id: string } | number> | undefined;
    const rawScreenshots = payload.screenshots as Array<{ image_id: string } | number> | undefined;
    const firstArtworkId =
      rawArtworks?.[0] != null
        ? typeof rawArtworks[0] === "number"
          ? null
          : rawArtworks[0].image_id
        : null;
    const firstScreenshotId =
      rawScreenshots?.[0] != null
        ? typeof rawScreenshots[0] === "number"
          ? null
          : rawScreenshots[0].image_id
        : null;
    let igdbBg: string | null = null;
    if (firstArtworkId) igdbBg = igdb1080pUrl(firstArtworkId);
    else if (firstScreenshotId) igdbBg = igdb1080pUrl(firstScreenshotId);
    add(
      "background_image",
      "fields.backgroundImage",
      igdbBg,
      game.background_image_url ?? null,
      "background_image"
    );

    // --- Relational fields ---
    const igdbGenres = (payload.genres as Array<{ slug: string; name: string }> | undefined) ?? [];
    add(
      "genres",
      "fields.genres",
      sorted(igdbGenres.map((g) => g.name)).join(", ") || null,
      sorted(localGenres).join(", ") || null,
      "genres"
    );

    const igdbPlatforms =
      (payload.platforms as Array<{ id: number; name: string } | number> | undefined) ?? [];
    const platformNames = igdbPlatforms
      .map((p) => (typeof p === "number" ? null : p.name))
      .filter(Boolean) as string[];
    add(
      "platforms",
      "fields.platforms",
      sorted(platformNames).join(", ") || null,
      sorted(localPlatforms).join(", ") || null,
      "platforms"
    );

    const igdbCompanies =
      (payload.involved_companies as
        | Array<{ company: { name: string; slug: string }; developer: boolean; publisher: boolean }>
        | undefined) ?? [];
    const igdbCoList: string[] = [];
    for (const ic of igdbCompanies) {
      if (ic.developer) igdbCoList.push(`${ic.company.name} (dev)`);
      if (ic.publisher) igdbCoList.push(`${ic.company.name} (pub)`);
    }
    const localCoList = sorted(localCompanies).map((c) => {
      const [slug, role] = c.split(":");
      return `${slug} (${role === "developer" ? "dev" : "pub"})`;
    });
    add(
      "companies",
      "fields.companies",
      sorted(igdbCoList).join(", ") || null,
      localCoList.join(", ") || null,
      "companies"
    );

    add(
      "screenshots",
      "fields.screenshots",
      rawScreenshots?.length ? `${rawScreenshots.length} screenshot(s)` : null,
      localScreenshots.length ? `${localScreenshots.length} screenshot(s)` : null,
      "screenshots"
    );
    add(
      "artworks",
      "fields.artworks",
      rawArtworks?.length ? `${rawArtworks.length} artwork(s)` : null,
      localArtworks.length ? `${localArtworks.length} artwork(s)` : null,
      "artworks"
    );

    const igdbVideos =
      (payload.videos as Array<{ video_id: string; name?: string }> | undefined) ?? [];
    add(
      "videos",
      "fields.videos",
      igdbVideos.map((v) => v.name || v.video_id).join(", ") || null,
      localVideos.map((v) => v.split(":")[1] || v).join(", ") || null,
      "videos"
    );

    const igdbAgeRatings =
      (payload.age_ratings as Array<{ rating_category: number }> | undefined) ?? [];
    add(
      "age_ratings",
      "fields.ageRatings",
      igdbAgeRatings.length ? `${igdbAgeRatings.length} rating(s)` : null,
      null,
      "age_ratings"
    );

    const igdbSimilar = (payload.similar_games as number[] | undefined) ?? [];
    add(
      "similar_games",
      "fields.similarGames",
      igdbSimilar.length ? `${igdbSimilar.length} jeu(x)` : null,
      localSimilarCount > 0 ? `${localSimilarCount} jeu(x)` : null,
      "similar_games"
    );

    const changedCount = fields.filter((f) => f.status !== "unchanged").length;
    const conflictCount = fields.filter((f) => f.status === "conflict").length;

    const result: WebhookDiffResult = {
      eventId,
      gameId,
      gameName,
      igdbId: event.igdb_id as number,
      fields,
      changedCount,
      conflictCount,
    };

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    logger.error("Webhook diff error", { error });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
