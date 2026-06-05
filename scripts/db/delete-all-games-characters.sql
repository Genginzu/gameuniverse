-- ============================================================================
-- Script: Suppression de TOUTES les données importées
-- ⚠️  OPÉRATION DESTRUCTIVE ET IRRÉVERSIBLE
-- À exécuter manuellement dans le SQL Editor de Supabase
--
-- Supprime : jeux, personnages, companies, genres, platforms, stores,
--            genders, species, character_roles, ratings, webhooks,
--            et toutes les traductions associées.
-- Conserve : profiles, auth, languages, supported_languages, achievements,
--            player data (posts, friendships, goals, xp, conversations).
-- ============================================================================

BEGIN;

-- ── Webhooks IGDB ──────────────────────────────────────────────────────────
DELETE FROM igdb_webhook_events;

-- ── Cache traductions ──────────────────────────────────────────────────────
DELETE FROM translation_stats_cache;

-- ── Personnages (enfants d'abord) ──────────────────────────────────────────
DELETE FROM character_field_overrides;
DELETE FROM character_comments;
DELETE FROM character_favorites;
DELETE FROM character_character_roles;
DELETE FROM character_relationships;
DELETE FROM character_media;
DELETE FROM character_games;
DELETE FROM character_translations;
DELETE FROM characters;

-- ── Jeux (enfants d'abord) ─────────────────────────────────────────────────
DELETE FROM game_price_history;
DELETE FROM game_dlc_extensions;
DELETE FROM game_field_overrides;
DELETE FROM game_music;
DELETE FROM game_sessions;
DELETE FROM game_versions;
DELETE FROM game_languages;
DELETE FROM game_reviews;
DELETE FROM game_collection_items;
DELETE FROM game_platforms;
DELETE FROM game_prices;
DELETE FROM game_rating_descriptors;
DELETE FROM game_ratings;
DELETE FROM game_companies;
DELETE FROM game_videos;
DELETE FROM game_artwork;
DELETE FROM game_screenshots;
DELETE FROM game_genres;
DELETE FROM game_translations;
DELETE FROM games;

-- ── Companies ──────────────────────────────────────────────────────────────
DELETE FROM company_translations;
DELETE FROM companies;

-- ── Genres ──────────────────────────────────────────────────────────────────
DELETE FROM genre_translations;
DELETE FROM genres;

-- ── Platforms ───────────────────────────────────────────────────────────────
DELETE FROM platform_translations;
DELETE FROM platforms;

-- ── Stores ──────────────────────────────────────────────────────────────────
DELETE FROM stores;

-- ── Genders ─────────────────────────────────────────────────────────────────
DELETE FROM gender_translations;
DELETE FROM genders;

-- ── Species ─────────────────────────────────────────────────────────────────
DELETE FROM species_translations;
DELETE FROM species;

-- ── Character Roles ─────────────────────────────────────────────────────────
DELETE FROM character_role_translations;
DELETE FROM character_roles;

-- ── Ratings & Content Descriptors ───────────────────────────────────────────
DELETE FROM rating_translations;
DELETE FROM ratings;
DELETE FROM content_descriptor_translations;
DELETE FROM content_descriptors;
DELETE FROM rating_systems;

COMMIT;
