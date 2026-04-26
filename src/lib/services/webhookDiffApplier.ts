/**
 * Shared logic for applying IGDB webhook update payloads to local game data.
 *
 * Each field is applied individually, respecting admin overrides:
 * - No override → auto-apply
 * - Override exists → skip (marked as conflict for admin review)
 * - Force-applied → apply even if override exists
 */

import { logger } from "@/lib/logger";
import type { SupabaseClient } from "@supabase/supabase-js";
import { IGDBService } from "./igdbService";
import { fetchMetacriticScore } from "./metacriticService";

export interface ApplyPayloadOptions {
  gameId: string;
  payload: Record<string, unknown>;
  /** Fields to force-apply even if admin has overridden them */
  forceFields?: Set<string>;
}

export interface ApplyPayloadResult {
  appliedFields: string[];
  skippedFields: string[];
  error?: string;
}

function can(field: string, overrides: Set<string>, force: Set<string>): boolean {
  return !overrides.has(field) || force.has(field);
}

// Cast supabase to bypass generated types for dynamic table access
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = (s: SupabaseClient) => s as any;

/**
 * Apply an IGDB webhook payload to a local game, respecting admin overrides.
 */
export async function applyWebhookPayload(
  supabase: SupabaseClient,
  { gameId, payload, forceFields = new Set() }: ApplyPayloadOptions
): Promise<ApplyPayloadResult> {
  const { data: overrides } = await db(supabase)
    .from("game_field_overrides")
    .select("field_name")
    .eq("game_id", gameId);

  const ov = new Set<string>((overrides ?? []).map((o: { field_name: string }) => o.field_name));
  const f = forceFields;
  const applied: string[] = [];
  const skipped: string[] = [];

  // ── Scalar game table fields ────────────────────────────────────────
  const gameUpdate: Record<string, unknown> = {};

  if (payload.first_release_date !== undefined) {
    if (can("release_date", ov, f)) {
      gameUpdate.release_date = payload.first_release_date
        ? new Date((payload.first_release_date as number) * 1000).toISOString().split("T")[0]
        : null;
      applied.push("release_date");
    } else skipped.push("release_date");
  }

  if (payload.aggregated_rating !== undefined) {
    if (can("metascore", ov, f)) {
      const { data: gameRow } = await supabase.from("games").select("slug").eq("id", gameId).single();
      if (gameRow?.slug) {
        const mcScore = await fetchMetacriticScore(gameRow.slug as string);
        if (mcScore !== null) {
          gameUpdate.metascore = mcScore;
          applied.push("metascore");
        }
      }
    } else skipped.push("metascore");
  }

  // ── Lazy-loaded IGDB game details ────────────────────────────────────
  // IGDB webhooks send sub-entity fields (cover, artworks, screenshots,
  // videos) as raw numeric IDs instead of expanded objects with image_id.
  // We fetch the full game details once from IGDB when needed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let _igdbGame: any = undefined;
  async function getIgdbGame() {
    if (_igdbGame !== undefined) return _igdbGame;
    const igdbId = payload.id as number | undefined;
    if (!igdbId) {
      _igdbGame = null;
      return null;
    }
    try {
      _igdbGame = await IGDBService.getGameDetails(igdbId);
    } catch {
      logger.warn("Webhook: failed to fetch game details from IGDB", { igdbId });
      _igdbGame = null;
    }
    return _igdbGame;
  }

  if (payload.cover !== undefined) {
    if (can("cover_image", ov, f)) {
      const raw = payload.cover;
      let url: string | null = null;
      if (typeof raw === "object" && raw !== null && "image_id" in raw) {
        const id = (raw as { image_id?: string }).image_id;
        if (id) url = `https://images.igdb.com/igdb/image/upload/t_cover_big/${id}.jpg`;
      } else if (typeof raw === "number") {
        const igdbGame = await getIgdbGame();
        if (igdbGame?.cover?.image_id) {
          url = IGDBService.buildImageUrl(igdbGame.cover.image_id, "cover_big");
        }
      }
      gameUpdate.cover_image_url = url;
      applied.push("cover_image");
    } else skipped.push("cover_image");
  }

  if (payload.slug !== undefined) {
    if (can("slug", ov, f)) {
      gameUpdate.slug = payload.slug;
      applied.push("slug");
    } else skipped.push("slug");
  }

  if (Object.keys(gameUpdate).length > 0) {
    gameUpdate.last_synced_at = new Date().toISOString();
    const { error } = await supabase.from("games").update(gameUpdate).eq("id", gameId);
    if (error) {
      logger.error("Failed to apply webhook game update", { gameId, error });
      return { appliedFields: [], skippedFields: [], error: error.message };
    }
  }

  // ── Translations (EN) ───────────────────────────────────────────────
  if (
    payload.name !== undefined ||
    payload.summary !== undefined ||
    payload.storyline !== undefined
  ) {
    if (can("translations", ov, f) || f.has("name") || f.has("summary") || f.has("storyline")) {
      const tu: Record<string, unknown> = {};
      if (payload.name !== undefined) tu.title = payload.name;
      if (payload.summary !== undefined) tu.description = payload.summary ?? null;
      if (payload.storyline !== undefined) tu.storyline = payload.storyline ?? null;

      if (Object.keys(tu).length > 0) {
        const { error } = await supabase
          .from("game_translations")
          .update(tu)
          .eq("game_id", gameId)
          .eq("language_code", "en");

        if (error) {
          logger.error("Failed to apply webhook translation update", { gameId, error });
        } else {
          if (payload.name !== undefined) applied.push("name");
          if (payload.summary !== undefined) applied.push("summary");
          if (payload.storyline !== undefined) applied.push("storyline");
        }
      }
    } else {
      if (payload.name !== undefined) skipped.push("name");
      if (payload.summary !== undefined) skipped.push("summary");
      if (payload.storyline !== undefined) skipped.push("storyline");
    }
  }

  // ── Background image (derived from artworks / screenshots) ──────────
  // IGDB webhooks may send artworks/screenshots as arrays of numeric IDs
  // instead of expanded objects. We need to resolve them via the API.
  let resolvedArtworks: Array<{ image_id: string }> | undefined;
  let resolvedScreenshots: Array<{ image_id: string }> | undefined;

  const rawArtworks = payload.artworks as unknown;
  const rawScreenshots = payload.screenshots as unknown;

  // Resolve artworks: could be [{image_id: "x"}] or [123, 456]
  if (Array.isArray(rawArtworks) && rawArtworks.length > 0) {
    if (
      typeof rawArtworks[0] === "object" &&
      rawArtworks[0] !== null &&
      "image_id" in rawArtworks[0]
    ) {
      resolvedArtworks = rawArtworks as Array<{ image_id: string }>;
    } else if (typeof rawArtworks[0] === "number") {
      const igdbGame = await getIgdbGame();
      if (igdbGame?.artworks?.length) {
        resolvedArtworks = igdbGame.artworks as Array<{ image_id: string }>;
      }
    }
  }

  // Resolve screenshots: same logic
  if (Array.isArray(rawScreenshots) && rawScreenshots.length > 0) {
    if (
      typeof rawScreenshots[0] === "object" &&
      rawScreenshots[0] !== null &&
      "image_id" in rawScreenshots[0]
    ) {
      resolvedScreenshots = rawScreenshots as Array<{ image_id: string }>;
    } else if (typeof rawScreenshots[0] === "number") {
      const igdbGame = await getIgdbGame();
      if (igdbGame?.screenshots?.length) {
        resolvedScreenshots = igdbGame.screenshots as Array<{ image_id: string }>;
      }
    }
  }

  if (resolvedArtworks !== undefined || resolvedScreenshots !== undefined) {
    if (can("background_image", ov, f)) {
      let bgUrl: string | null = null;
      const firstArt = resolvedArtworks?.[0];
      const firstSs = resolvedScreenshots?.[0];
      if (firstArt?.image_id)
        bgUrl = `https://images.igdb.com/igdb/image/upload/t_1080p/${firstArt.image_id}.jpg`;
      else if (firstSs?.image_id)
        bgUrl = `https://images.igdb.com/igdb/image/upload/t_1080p/${firstSs.image_id}.jpg`;

      if (bgUrl) {
        await supabase.from("games").update({ background_image_url: bgUrl }).eq("id", gameId);
        applied.push("background_image");
      }
    } else skipped.push("background_image");
  }

  // ── Screenshots ─────────────────────────────────────────────────────
  if (resolvedScreenshots !== undefined) {
    if (can("screenshots", ov, f)) {
      const items = resolvedScreenshots
        .filter((s) => s?.image_id)
        .map((s, i) => ({
          game_id: gameId,
          url: `https://images.igdb.com/igdb/image/upload/t_1080p/${s.image_id}.jpg`,
          display_order: i,
          is_featured: i === 0,
        }));
      if (items.length > 0) {
        await db(supabase).from("game_screenshots").delete().eq("game_id", gameId);
        await db(supabase).from("game_screenshots").insert(items);
        applied.push("screenshots");
      }
    } else skipped.push("screenshots");
  }

  // ── Artworks ────────────────────────────────────────────────────────
  if (resolvedArtworks !== undefined) {
    if (can("artworks", ov, f)) {
      const items = resolvedArtworks
        .filter((a) => a?.image_id)
        .map((a, i) => ({
          game_id: gameId,
          url: `https://images.igdb.com/igdb/image/upload/t_1080p/${a.image_id}.jpg`,
          artwork_type: "promotional",
          display_order: i,
          is_featured: i === 0,
        }));
      if (items.length > 0) {
        await db(supabase).from("game_artwork").delete().eq("game_id", gameId);
        await db(supabase).from("game_artwork").insert(items);
        applied.push("artworks");
      }
    } else skipped.push("artworks");
  }

  // ── Videos ──────────────────────────────────────────────────────────
  const rawVideos = payload.videos as unknown;
  if (rawVideos !== undefined && Array.isArray(rawVideos)) {
    if (can("videos", ov, f)) {
      let resolvedVideos: Array<{ video_id: string; name?: string }> | undefined;

      if (
        rawVideos.length > 0 &&
        typeof rawVideos[0] === "object" &&
        rawVideos[0] !== null &&
        "video_id" in rawVideos[0]
      ) {
        resolvedVideos = rawVideos as Array<{ video_id: string; name?: string }>;
      } else if (rawVideos.length > 0 && typeof rawVideos[0] === "number") {
        const igdbGame = await getIgdbGame();
        if (igdbGame?.videos?.length) {
          resolvedVideos = igdbGame.videos as Array<{ video_id: string; name?: string }>;
        }
      }

      if (resolvedVideos?.length) {
        const items = resolvedVideos
          .filter((v) => v?.video_id)
          .map((v, i) => ({
            game_id: gameId,
            url: `https://www.youtube.com/watch?v=${v.video_id}`,
            thumbnail_url: `https://img.youtube.com/vi/${v.video_id}/maxresdefault.jpg`,
            title: v.name || "Video",
            video_type: "trailer",
            display_order: i,
            is_featured: i === 0,
          }));
        if (items.length > 0) {
          await db(supabase).from("game_videos").delete().eq("game_id", gameId);
          await db(supabase).from("game_videos").insert(items);
          applied.push("videos");
        }
      }
    } else skipped.push("videos");
  }

  // ── Genres ──────────────────────────────────────────────────────────
  const pGenres = payload.genres as Array<{ id: number; name: string; slug: string }> | undefined;
  if (pGenres !== undefined) {
    if (can("genres", ov, f)) {
      const validGenres = pGenres.filter((g) => typeof g === "object" && g?.slug);
      if (validGenres.length > 0) {
        const genreIds: string[] = [];
        for (const g of validGenres) {
          const { data: existing } = await supabase
            .from("genres")
            .select("id")
            .eq("slug", g.slug)
            .single();
          if (existing) {
            genreIds.push(existing.id);
          } else {
            const { data: created } = await supabase
              .from("genres")
              .insert({ slug: g.slug })
              .select("id")
              .single();
            if (created) {
              genreIds.push(created.id);
              await supabase
                .from("genre_translations")
                .insert({ genre_id: created.id, language_code: "en", name: g.name });
            }
          }
        }
        if (genreIds.length > 0) {
          await supabase.from("game_genres").delete().eq("game_id", gameId);
          await supabase
            .from("game_genres")
            .insert(genreIds.map((gid) => ({ game_id: gameId, genre_id: gid })));
          applied.push("genres");
        }
      }
    } else skipped.push("genres");
  }

  // ── Platforms ───────────────────────────────────────────────────────
  const pPlatforms = payload.platforms as Array<{ id: number; name: string }> | undefined;
  if (pPlatforms !== undefined) {
    if (can("platforms", ov, f)) {
      const valid = pPlatforms.filter((p) => typeof p === "object" && p?.id);
      if (valid.length > 0) {
        const platformIds: string[] = [];
        for (const p of valid) {
          const { data: existing } = await db(supabase)
            .from("platforms")
            .select("id")
            .eq("igdb_id", p.id)
            .single();
          if (existing) {
            platformIds.push(existing.id);
          } else {
            const slug = (p.name || `platform-${p.id}`)
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, "")
              .replace(/-+/g, "-")
              .replace(/^-|-$/g, "");
            const { data: created } = await db(supabase)
              .from("platforms")
              .insert({ slug, igdb_id: p.id })
              .select("id")
              .single();
            if (created) {
              platformIds.push(created.id);
              await db(supabase)
                .from("platform_translations")
                .insert({ platform_id: created.id, language_code: "en", name: p.name });
            }
          }
        }
        if (platformIds.length > 0) {
          await db(supabase).from("game_platforms").delete().eq("game_id", gameId);
          await db(supabase)
            .from("game_platforms")
            .insert(platformIds.map((pid) => ({ game_id: gameId, platform_id: pid })));
          applied.push("platforms");
        }
      }
    } else skipped.push("platforms");
  }

  // ── Companies ───────────────────────────────────────────────────────
  const pCompanies = payload.involved_companies as
    | Array<{
        company: { id: number; name: string; slug: string };
        developer: boolean;
        publisher: boolean;
      }>
    | undefined;
  if (pCompanies !== undefined) {
    if (can("companies", ov, f)) {
      const valid = pCompanies.filter((c) => typeof c === "object" && c?.company?.slug);
      if (valid.length > 0) {
        const rows: Array<{
          game_id: string;
          company_id: string;
          role: string;
          is_primary: boolean;
        }> = [];
        const devCount = { n: 0 };
        const pubCount = { n: 0 };

        for (const ic of valid) {
          const { data: existing } = await supabase
            .from("companies")
            .select("id")
            .eq("slug", ic.company.slug)
            .single();

          let companyId: string | null = null;
          if (existing) {
            companyId = existing.id;
          } else {
            const { data: created } = await supabase
              .from("companies")
              .insert({
                name: ic.company.name,
                slug: ic.company.slug,
                company_type: ic.developer ? "developer" : ic.publisher ? "publisher" : null,
              })
              .select("id")
              .single();
            if (created) companyId = created.id;
          }

          if (companyId) {
            if (ic.developer) {
              rows.push({
                game_id: gameId,
                company_id: companyId,
                role: "developer",
                is_primary: devCount.n === 0,
              });
              devCount.n++;
            }
            if (ic.publisher) {
              rows.push({
                game_id: gameId,
                company_id: companyId,
                role: "publisher",
                is_primary: pubCount.n === 0,
              });
              pubCount.n++;
            }
          }
        }

        if (rows.length > 0) {
          await supabase.from("game_companies").delete().eq("game_id", gameId);
          await supabase.from("game_companies").insert(rows);
          applied.push("companies");
        }
      }
    } else skipped.push("companies");
  }

  // ── Age ratings ─────────────────────────────────────────────────────
  // Age ratings from webhooks are complex (need rating system resolution).
  // We log them but don't auto-apply — they require the full import logic.
  const pAgeRatings = payload.age_ratings as Array<{ rating_category: number }> | undefined;
  if (pAgeRatings !== undefined && pAgeRatings.length > 0) {
    if (can("age_ratings", ov, f)) {
      // Age ratings need the full GameImportService logic to resolve
      // rating systems, so we mark as applied only if we can delegate.
      // For now, log and skip — the diff page shows them for admin review.
      logger.info("Webhook: age_ratings present but require full import logic", { gameId });
    } else {
      skipped.push("age_ratings");
    }
  }

  // ── Similar games ───────────────────────────────────────────────────
  const pSimilar = payload.similar_games as number[] | undefined;
  if (pSimilar !== undefined) {
    if (can("similar_games", ov, f)) {
      if (pSimilar.length > 0) {
        // Resolve local game IDs
        const { data: localGames } = await supabase
          .from("games")
          .select("id, igdb_id")
          .in("igdb_id", pSimilar);

        const igdbToLocal = new Map(
          (localGames ?? []).map((g) => [g.igdb_id as number, g.id as string])
        );

        const rows = pSimilar.map((igdbId, i) => ({
          game_id: gameId,
          similar_igdb_id: igdbId,
          similar_game_id: igdbToLocal.get(igdbId) ?? null,
          display_order: i,
        }));

        await db(supabase).from("game_similar_games").delete().eq("game_id", gameId);
        await db(supabase).from("game_similar_games").upsert(rows, {
          onConflict: "game_id,similar_igdb_id",
        });
        applied.push("similar_games");
      }
    } else skipped.push("similar_games");
  }

  return { appliedFields: applied, skippedFields: skipped };
}
