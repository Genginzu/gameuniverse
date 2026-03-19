/**
 * Service pour la gestion des plateformes de jeux
 * Centralise la logique de récupération des plateformes (pattern GenreService)
 */

import type { FetchPlatformsParams, AdminPlatform } from "@/types/admin-platforms";

export class PlatformService {
  private static getBaseUrl(): string {
    return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  }

  /**
   * Récupère la liste paginée des plateformes (admin) avec search, tri, game count
   * @param params - Paramètres de requête (page, limit, search, sortBy, sortOrder, locale)
   * @returns Liste paginée des plateformes admin
   */
  static async fetchPlatforms(params: FetchPlatformsParams = {}): Promise<{
    platforms: AdminPlatform[];
    total: number;
    page: number;
    limit: number;
  }> {
    const baseUrl = this.getBaseUrl();
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.search) searchParams.set("search", params.search);
    if (params.sortBy) searchParams.set("sort_by", params.sortBy);
    if (params.sortOrder) searchParams.set("sort_order", params.sortOrder);
    if (params.locale) searchParams.set("locale", params.locale);

    const qs = searchParams.toString();
    const url = `${baseUrl}/api/admin/platforms${qs ? `?${qs}` : ""}`;

    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Failed to fetch platforms: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Récupère la liste des plateformes pour les filtres UI, traduites dans la locale courante
   * Fallback vers EN si la traduction n'existe pas
   * @param locale - La locale (fr, en)
   * @returns Liste des plateformes avec game count
   */
  static async fetchPlatformsByLocale(locale: string = "fr"): Promise<
    Array<{
      id: string;
      slug: string;
      name: string;
      abbreviation?: string;
      iconUrl?: string;
      gameCount: number;
    }>
  > {
    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/api/platforms?locale=${locale}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch platforms: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.platforms || [];
  }

  /**
   * Récupère le détail d'une plateforme par slug
   * @param slug - Le slug de la plateforme
   * @param locale - La locale pour la traduction (fallback EN)
   * @returns Détail de la plateforme ou null si non trouvée
   */
  static async fetchPlatformBySlug(
    slug: string,
    locale: string = "fr"
  ): Promise<AdminPlatform | null> {
    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/api/admin/platforms/${slug}?locale=${locale}`, {
      cache: "no-store",
    });

    if (response.status === 404) return null;

    if (!response.ok) {
      throw new Error(`Failed to fetch platform: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}
