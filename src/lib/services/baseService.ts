/**
 * Base service class providing common functionality for entity services.
 * Centralizes shared logic for fetching, existence checks, and metadata generation.
 *
 * @template TDetails - The detailed entity type (e.g., GameDetails, PlayerDetails)
 * @template TSummary - The summary entity type (e.g., GameSummary, PlayerSummary)
 */

export interface FetchOptions {
  search?: string;
  page?: number;
  limit?: number;
  locale?: string;
  [key: string]: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface EntityMetadata {
  title: string;
  description?: string;
  openGraph?: {
    title: string;
    description?: string;
    images?: string[];
  };
}

export abstract class BaseService<TDetails, TSummary> {
  /**
   * The name of the entity type (e.g., "game", "player", "character")
   */
  protected abstract readonly entityName: string;

  /**
   * The API path for this entity (e.g., "/api/games", "/api/players")
   */
  protected abstract readonly apiPath: string;

  /**
   * Gets the base URL for API requests.
   * Uses NEXT_PUBLIC_BASE_URL environment variable or defaults to localhost.
   */
  protected static getBaseUrl(): string {
    return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  }

  /**
   * Fetches the details of a single entity by its identifier.
   *
   * @param identifier - The unique identifier (slug or ID) of the entity
   * @param locale - The locale for translations (default: "fr")
   * @returns The entity details or null if not found
   */
  async fetchDetails(identifier: string, locale: string = "fr"): Promise<TDetails | null> {
    try {
      const baseUrl = BaseService.getBaseUrl();
      const url = `${baseUrl}${this.apiPath}/${identifier}?locale=${locale}`;
      console.warn(`[${this.entityName}Service] Fetching details from: ${url}`);

      const response = await fetch(url, {
        cache: "no-store",
      });

      console.warn(`[${this.entityName}Service] Response status: ${response.status}`);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[${this.entityName}Service] Entity not found: ${identifier}`);
          return null;
        }
        const errorText = await response.text();
        console.error(`[${this.entityName}Service] Error response: ${errorText}`);
        throw new Error(
          `Failed to fetch ${this.entityName} details: ${response.status} ${response.statusText}`
        );
      }

      const details: TDetails = await response.json();
      return details;
    } catch (error) {
      console.error(`Error fetching ${this.entityName} details:`, error);
      throw error;
    }
  }

  /**
   * Fetches a paginated list of entities with optional filters.
   *
   * @param options - Fetch options including search, pagination, and filters
   * @returns Paginated response with items and pagination metadata
   */
  async fetchList(options: FetchOptions = {}): Promise<PaginatedResponse<TSummary>> {
    try {
      const baseUrl = BaseService.getBaseUrl();
      const searchParams = new URLSearchParams();

      // Add all options to search params
      for (const [key, value] of Object.entries(options)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            searchParams.set(key, value.join(","));
          } else {
            searchParams.set(key, String(value));
          }
        }
      }

      const response = await fetch(`${baseUrl}${this.apiPath}?${searchParams.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${this.entityName} list: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${this.entityName} list:`, error);
      throw error;
    }
  }

  /**
   * Checks if an entity exists by its identifier.
   *
   * @param identifier - The unique identifier (slug or ID) of the entity
   * @param locale - The locale for translations (default: "fr")
   * @returns true if the entity exists, false otherwise
   */
  async exists(identifier: string, locale: string = "fr"): Promise<boolean> {
    try {
      const entity = await this.fetchDetails(identifier, locale);
      return entity !== null;
    } catch (_error) {
      console.warn(`Failed to check if ${this.entityName} exists: ${identifier}`, _error);
      return false;
    }
  }

  /**
   * Generates SEO metadata for an entity.
   * Subclasses should override this method to provide entity-specific metadata.
   *
   * @param identifier - The unique identifier (slug or ID) of the entity
   * @param locale - The locale for translations (default: "fr")
   * @returns Metadata object for SEO
   */
  async generateMetadata(identifier: string, locale: string = "fr"): Promise<EntityMetadata> {
    try {
      const entity = await this.fetchDetails(identifier, locale);

      if (!entity) {
        return {
          title: locale === "fr" ? `${this.entityName} non trouvé` : `${this.entityName} not found`,
        };
      }

      // Default implementation - subclasses should override for specific behavior
      return this.buildMetadata(entity, locale);
    } catch (error) {
      console.error(`Error generating ${this.entityName} metadata:`, error);
      return {
        title: locale === "fr" ? "Erreur" : "Error",
      };
    }
  }

  /**
   * Builds metadata from an entity. Subclasses should override this method
   * to provide entity-specific metadata formatting.
   *
   * @param entity - The entity to build metadata from
   * @param locale - The locale for translations
   * @returns Metadata object for SEO
   */
  protected abstract buildMetadata(entity: TDetails, locale: string): EntityMetadata;
}
