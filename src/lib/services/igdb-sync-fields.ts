/**
 * Fonctions de synchronisation par champ IGDB → Supabase.
 * Chaque fonction gère la mise à jour d'une catégorie de données spécifique.
 */

import { IGDBService } from "./igdbService";
import type { IGDBGame } from "@/types/igdb";
import type { SyncSupabaseClient } from "./igdb-sync";

// ---------------------------------------------------------------------------
// Helper pour contourner le typage SyncSupabaseClient sur les deletes.
// Le vrai client Supabase chaîne .delete().eq() comme un builder,
// mais l'interface minimale ne le modélise pas correctement.
// ---------------------------------------------------------------------------

/** Supprime toutes les lignes d'une table pour un game_id donné */
async function deleteByGameId(
  supabase: SyncSupabaseClient,
  table: string,
  gameId: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from(table).delete().eq("game_id", gameId);
  if (error) throw new Error(`Failed to delete from ${table}: ${error.message}`);
}
// Transformation IGDB → Supabase (logique partagée avec game-importer)
// ---------------------------------------------------------------------------

/** Transforme les données de base d'un jeu IGDB en colonnes Supabase */
export function transformIGDBGameData(igdbGame: IGDBGame) {
  const coverUrl = igdbGame.cover?.image_id
    ? IGDBService.buildImageUrl(igdbGame.cover.image_id, "cover_big")
    : null;

  let backgroundUrl: string | null = null;
  if (igdbGame.artworks && igdbGame.artworks.length > 0) {
    backgroundUrl = IGDBService.buildImageUrl(igdbGame.artworks[0].image_id, "1080p");
  } else if (igdbGame.screenshots && igdbGame.screenshots.length > 0) {
    backgroundUrl = IGDBService.buildImageUrl(igdbGame.screenshots[0].image_id, "1080p");
  }

  const releaseDate = igdbGame.first_release_date
    ? new Date(igdbGame.first_release_date * 1000).toISOString().split("T")[0]
    : null;

  const metascore = igdbGame.aggregated_rating ? Math.round(igdbGame.aggregated_rating) : null;

  return { coverUrl, backgroundUrl, releaseDate, metascore };
}

// ---------------------------------------------------------------------------
// Helpers de synchronisation par champ
// ---------------------------------------------------------------------------

import type { TrackableField } from "@/types/admin-games";

/** Met à jour les colonnes directes du jeu (cover, background, release_date, metascore) */
export async function syncDirectFields(
  supabase: SyncSupabaseClient,
  gameId: string,
  igdbGame: IGDBGame,
  fields: TrackableField[]
): Promise<void> {
  const { coverUrl, backgroundUrl, releaseDate, metascore } = transformIGDBGameData(igdbGame);
  const updates: Record<string, unknown> = {};

  if (fields.includes("cover_image")) updates.cover_image_url = coverUrl;
  if (fields.includes("background_image")) updates.background_image_url = backgroundUrl;
  if (fields.includes("release_date")) updates.release_date = releaseDate;
  if (fields.includes("metascore")) updates.metascore = metascore;

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from("games").update(updates).eq("id", gameId);
    if (error) throw new Error(`Failed to update game fields: ${error.message}`);
  }
}

/** Synchronise les traductions (titre/description en anglais depuis IGDB) */
export async function syncTranslations(
  supabase: SyncSupabaseClient,
  gameId: string,
  igdbGame: IGDBGame
): Promise<void> {
  const description = igdbGame.summary || igdbGame.storyline || null;
  const { error } = await supabase
    .from("game_translations")
    .upsert(
      { game_id: gameId, language_code: "en", title: igdbGame.name, description },
      { onConflict: "game_id,language_code" }
    );
  if (error) throw new Error(`Failed to sync translations: ${error.message}`);
}

/** Synchronise les genres — crée les genres manquants dans la DB locale */
export async function syncGenres(
  supabase: SyncSupabaseClient,
  gameId: string,
  igdbGame: IGDBGame
): Promise<void> {
  await deleteByGameId(supabase, "game_genres", gameId);
  if (!igdbGame.genres || igdbGame.genres.length === 0) return;

  for (const igdbGenre of igdbGame.genres) {
    const { data: existing } = await supabase
      .from("genres")
      .select("id")
      .eq("slug", igdbGenre.slug)
      .single();

    let genreId: string;

    if (existing?.id) {
      genreId = existing.id as string;
    } else {
      const { data: newGenre } = await supabase
        .from("genres")
        .insert({ slug: igdbGenre.slug })
        .select("id")
        .single();
      if (!newGenre?.id) continue;
      genreId = newGenre.id as string;

      await supabase
        .from("genre_translations")
        .insert({ genre_id: genreId, language_code: "en", name: igdbGenre.name })
        .select("id")
        .single();
    }

    // game_genres est une table de liaison sans colonne id — insert simple via as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("game_genres").insert({ game_id: gameId, genre_id: genreId });
  }
}

/** Synchronise les companies — crée les companies manquantes dans la DB locale */
export async function syncCompanies(
  supabase: SyncSupabaseClient,
  gameId: string,
  igdbGame: IGDBGame
): Promise<void> {
  // Supprimer les companies existantes du jeu
  await deleteByGameId(supabase, "game_companies", gameId);
  if (!igdbGame.involved_companies || igdbGame.involved_companies.length === 0) return;

  for (const ic of igdbGame.involved_companies) {
    // Chercher la company par slug dans la DB locale
    const { data: existing } = await supabase
      .from("companies")
      .select("id")
      .eq("slug", ic.company.slug)
      .single();

    let companyId: string;

    if (existing?.id) {
      companyId = existing.id as string;
    } else {
      // Créer la company si elle n'existe pas localement
      const { data: newCompany } = await supabase
        .from("companies")
        .insert({
          name: ic.company.name,
          slug: ic.company.slug,
          company_type: ic.developer ? "developer" : ic.publisher ? "publisher" : null,
        })
        .select("id")
        .single();
      if (!newCompany?.id) continue;
      companyId = newCompany.id as string;
    }

    if (ic.developer) {
      await supabase
        .from("game_companies")
        .insert({ game_id: gameId, company_id: companyId, role: "developer", is_primary: false })
        .select("id")
        .single();
    }
    if (ic.publisher) {
      await supabase
        .from("game_companies")
        .insert({ game_id: gameId, company_id: companyId, role: "publisher", is_primary: false })
        .select("id")
        .single();
    }
  }
}

/** Synchronise les screenshots */
export async function syncScreenshots(
  supabase: SyncSupabaseClient,
  gameId: string,
  igdbGame: IGDBGame
): Promise<void> {
  await deleteByGameId(supabase, "game_screenshots", gameId);
  if (!igdbGame.screenshots || igdbGame.screenshots.length === 0) return;

  for (let i = 0; i < igdbGame.screenshots.length; i++) {
    await supabase
      .from("game_screenshots")
      .insert({
        game_id: gameId,
        url: IGDBService.buildImageUrl(igdbGame.screenshots[i].image_id, "1080p"),
        display_order: i,
        is_featured: i === 0,
      })
      .select("id")
      .single();
  }
}

/** Synchronise les artworks */
export async function syncArtworks(
  supabase: SyncSupabaseClient,
  gameId: string,
  igdbGame: IGDBGame
): Promise<void> {
  await deleteByGameId(supabase, "game_artwork", gameId);
  if (!igdbGame.artworks || igdbGame.artworks.length === 0) return;

  for (let i = 0; i < igdbGame.artworks.length; i++) {
    await supabase
      .from("game_artwork")
      .insert({
        game_id: gameId,
        url: IGDBService.buildImageUrl(igdbGame.artworks[i].image_id, "1080p"),
        artwork_type: "promotional",
        display_order: i,
        is_featured: i === 0,
      })
      .select("id")
      .single();
  }
}

// Les fonctions syncAgeRatings, syncVersions, syncLanguages, syncPlaytime
// sont dans igdb-sync-fields-extended.ts pour respecter la limite de 300 lignes.
export {
  syncAgeRatings,
  syncVersions,
  syncLanguages,
  syncPlaytime,
} from "./igdb-sync-fields-extended";
