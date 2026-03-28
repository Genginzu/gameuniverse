/**
 * Types for IGDB webhook events and management.
 */

/** Event types supported by IGDB webhooks */
export type WebhookEventType = "create" | "update" | "delete";

/** Processing status of a webhook event */
export type WebhookEventStatus = "received" | "processing" | "processed" | "failed" | "ignored";

/** IGDB entity types we subscribe to */
export type WebhookEntityType = (typeof IGDB_ENDPOINTS)[number];

/** All IGDB API endpoints available for webhook registration */
export const IGDB_ENDPOINTS = [
  // Games
  "games",
  "game_engines",
  "game_engine_logos",
  "game_localizations",
  "game_modes",
  "game_release_formats",
  "game_statuses",
  "game_time_to_beats",
  "game_types",
  "game_versions",
  "game_version_features",
  "game_version_feature_values",
  "game_videos",
  // Characters
  "characters",
  "character_genders",
  "character_mug_shots",
  "character_species",
  // Age Ratings
  "age_ratings",
  "age_rating_categories",
  "age_rating_content_descriptions",
  "age_rating_content_description_types",
  "age_rating_content_descriptions_v2",
  "age_rating_organizations",
  // Collections & Franchises
  "collections",
  "collection_memberships",
  "collection_membership_types",
  "collection_relations",
  "collection_relation_types",
  "collection_types",
  "franchises",
  // Companies
  "companies",
  "company_logos",
  "company_sizes",
  "company_statuses",
  "company_types",
  "company_type_histories",
  "company_websites",
  "involved_companies",
  // Platforms
  "platforms",
  "platform_families",
  "platform_logos",
  "platform_types",
  "platform_versions",
  "platform_version_companies",
  "platform_version_release_dates",
  "platform_websites",
  // Release Dates
  "release_dates",
  "release_date_regions",
  "release_date_statuses",
  "date_formats",
  "regions",
  // Media
  "covers",
  "screenshots",
  "artworks",
  "artwork_types",
  // Genres, Themes, Keywords
  "genres",
  "themes",
  "keywords",
  "player_perspectives",
  // Languages
  "languages",
  "language_supports",
  "language_support_types",
  // Multiplayer
  "multiplayer_modes",
  // External Games
  "external_games",
  "external_game_sources",
  // Events
  "events",
  "event_logos",
  "event_networks",
  "network_types",
  // Names & Websites
  "alternative_names",
  "websites",
  "website_types",
  // Popularity
  "popularity_primitives",
  "popularity_types",
] as const;

/** A webhook event stored in the database */
export interface WebhookEvent {
  id: string;
  event_type: WebhookEventType;
  entity_type: string;
  igdb_id: number;
  game_id: string | null;
  character_id: string | null;
  payload: Record<string, unknown>;
  status: WebhookEventStatus;
  error_message: string | null;
  processed_at: string | null;
  created_at: string;
}

/** Webhook event with resolved entity names for display */
export interface WebhookEventWithDetails extends WebhookEvent {
  game_name?: string | null;
  game_slug?: string | null;
  character_name?: string | null;
  character_slug?: string | null;
}

/** IGDB webhook registration info */
export interface IGDBWebhookRegistration {
  id: number;
  url: string;
  category: number;
  sub_category: number;
  active: boolean;
  api_key: string;
  secret: string;
  created_at: string;
  updated_at: string;
}

/** Parameters for registering a webhook with IGDB */
export interface WebhookRegistrationParams {
  endpoint: WebhookEntityType;
  method: WebhookEventType;
  url: string;
  secret: string;
}

/** Query params for listing webhook events */
export interface WebhookEventsQuery {
  entityType?: string;
  eventType?: WebhookEventType;
  status?: WebhookEventStatus;
  page?: number;
  limit?: number;
}
