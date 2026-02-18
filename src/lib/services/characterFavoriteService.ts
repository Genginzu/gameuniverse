import { createServerClient } from "@/lib/supabase-server";
import type { CharacterFavoriteSummary } from "@/types/character";

/**
 * Row type returned by the character_favorites query with character joins.
 */
interface FavoriteRow {
  character_id: string;
  created_at: string;
  characters: {
    id: string;
    slug: string;
    main_image: string | null;
    background_color: string | null;
    character_translations: {
      name: string;
      role: string | null;
    }[];
    character_games: {
      is_primary: boolean;
      games: {
        game_translations: {
          title: string;
        }[];
      } | null;
    }[];
  } | null;
}

// character_favorites table is not yet in the generated Supabase types
// (migration applied but types not regenerated). We use `as any` for the
// table name so that `.from()` doesn't resolve to `never`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

/**
 * Service pour la gestion des favoris de personnages.
 * Utilise directement Supabase via createServerClient (côté serveur).
 * Gère gracieusement le cas PGRST205 (table non trouvée / migration non appliquée).
 */
export class CharacterFavoriteService {
  /**
   * Ajouter un personnage aux favoris d'un utilisateur.
   * Lève une erreur si le favori existe déjà (contrainte UNIQUE → code 23505).
   */
  static async addFavorite(characterId: string, userId: string): Promise<void> {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from("character_favorites" as UntypedFrom)
      .insert({ user_id: userId, character_id: characterId });

    if (error) {
      if (error.code === "PGRST205") {
        console.warn("character_favorites table not found - migration not applied yet");
        return;
      }
      throw error;
    }
  }

  /**
   * Retirer un personnage des favoris d'un utilisateur.
   */
  static async removeFavorite(characterId: string, userId: string): Promise<void> {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from("character_favorites" as UntypedFrom)
      .delete()
      .eq("user_id", userId)
      .eq("character_id", characterId);

    if (error) {
      if (error.code === "PGRST205") {
        console.warn("character_favorites table not found - migration not applied yet");
        return;
      }
      throw error;
    }
  }

  /**
   * Vérifier si un personnage est dans les favoris d'un utilisateur.
   * Utilise la fonction SQL `is_character_favorited` pour la performance.
   */
  static async isFavorite(characterId: string, userId: string): Promise<boolean> {
    const supabase = await createServerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.rpc("is_character_favorited" as any, {
      user_uuid: userId,
      character_uuid: characterId,
    });

    if (error) {
      if (error.code === "PGRST205" || error.code === "42883") {
        console.warn("is_character_favorited function not found - migration not applied yet");
        return false;
      }
      throw error;
    }

    return data === true;
  }

  /**
   * Obtenir le nombre total de favoris pour un personnage.
   * Utilise la fonction SQL `get_character_favorite_count` pour la performance.
   */
  static async getFavoriteCount(characterId: string): Promise<number> {
    const supabase = await createServerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.rpc("get_character_favorite_count" as any, {
      character_uuid: characterId,
    });

    if (error) {
      if (error.code === "PGRST205" || error.code === "42883") {
        console.warn("get_character_favorite_count function not found - migration not applied yet");
        return 0;
      }
      throw error;
    }

    return data ?? 0;
  }

  /**
   * Obtenir la liste des personnages favoris d'un utilisateur.
   * Triés par date d'ajout décroissante.
   */
  static async getUserFavorites(
    userId: string,
    locale: string
  ): Promise<CharacterFavoriteSummary[]> {
    return this.fetchFavorites({ userId, locale });
  }

  /**
   * Obtenir la liste des personnages favoris d'un joueur (profil public).
   * Triés par date d'ajout décroissante.
   */
  static async getPlayerFavorites(
    playerId: string,
    locale: string
  ): Promise<CharacterFavoriteSummary[]> {
    return this.fetchFavorites({ userId: playerId, locale });
  }

  /**
   * Requête commune pour récupérer les favoris d'un utilisateur avec les
   * détails du personnage (nom, rôle, image, jeu principal).
   */
  private static async fetchFavorites({
    userId,
    locale,
  }: {
    userId: string;
    locale: string;
  }): Promise<CharacterFavoriteSummary[]> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from("character_favorites" as UntypedFrom)
      .select(
        `
        character_id,
        created_at,
        characters(
          id,
          slug,
          main_image,
          background_color,
          character_translations!inner(
            name,
            role
          ),
          character_games(
            is_primary,
            games(
              game_translations(
                title
              )
            )
          )
        )
      `
      )
      .eq("user_id", userId)
      .eq("characters.character_translations.language_code", locale)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST205") {
        console.warn("character_favorites table not found - migration not applied yet");
        return [];
      }
      throw error;
    }

    return ((data ?? []) as unknown as FavoriteRow[])
      .filter((row) => row.characters !== null)
      .map((row) => this.transformFavoriteRow(row));
  }

  /**
   * Transforme une ligne brute Supabase en CharacterFavoriteSummary.
   */
  private static transformFavoriteRow(row: FavoriteRow): CharacterFavoriteSummary {
    const character = row.characters!;
    const translation = character.character_translations?.[0];

    // Jeu principal : priorité au jeu marqué is_primary, sinon le premier
    const primaryGameRelation = character.character_games?.find((cg) => cg.is_primary);
    const primaryGame =
      primaryGameRelation?.games?.game_translations?.[0]?.title ||
      character.character_games?.[0]?.games?.game_translations?.[0]?.title ||
      "Unknown";

    return {
      id: character.id,
      slug: character.slug,
      name: translation?.name || "Unnamed",
      role: translation?.role || undefined,
      mainImage: character.main_image || undefined,
      backgroundColor: character.background_color || undefined,
      primaryGame,
      favoritedAt: row.created_at,
    };
  }
}
