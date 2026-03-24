-- ============================================================================
-- Script: Suppression de TOUS les jeux et personnages
-- ⚠️  OPÉRATION DESTRUCTIVE ET IRRÉVERSIBLE
-- À exécuter manuellement dans le SQL Editor de Supabase
-- ============================================================================

BEGIN;

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

COMMIT;
