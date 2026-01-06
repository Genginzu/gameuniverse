/**
 * Service pour la gestion des genres de jeux
 * Centralise toute la logique de récupération des genres
 */
export class GenreService {
  private static getBaseUrl(): string {
    return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  }

  /**
   * Récupère la liste des genres avec le nombre de jeux par genre
   * @param locale - La locale (fr, en)
   * @returns Liste des genres avec compteurs
   */
  static async fetchGenres(locale: string = "fr"): Promise<
    Array<{
      id: string;
      slug: string;
      name: string;
      description?: string;
      gameCount: number;
    }>
  > {
    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(`${baseUrl}/api/genres?locale=${locale}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch genres: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.genres || [];
    } catch (error) {
      console.error("Error fetching genres:", error);
      throw error;
    }
  }
}
