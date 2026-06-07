-- ============================================================================
-- Script : Extraction des jeux de plus de 20 ans + données associées
-- LECTURE SEULE — ne modifie rien. Produit un dump SQL réimportable.
--
-- But : sortir ces jeux de la base (free tier) puis les réintégrer plus tard
--       via le fichier généré, sans perte de données.
--
-- Usage (depuis le host, contre la base voulue) :
--   psql "$DB_URL" -v cutoff=2006-06-03 -v out=scripts/dumps/old_games_extract.sql \
--        -f scripts/db/extract-old-games.sql
--
-- Le fichier généré est une suite de blocs « COPY public.<table> FROM stdin; »
-- en ordre parent -> enfant. Réimport (dans une base au MÊME schéma, avec les
-- catalogues partagés déjà présents) :
--   psql "$TARGET_URL" -f scripts/dumps/old_games_extract.sql
--
-- Hypothèses :
--   - cutoff = aujourd'hui - 20 ans (ajustable via -v cutoff).
--   - Jeux sans release_date (NULL) EXCLUS (âge inconnu → conservés).
--   - Catalogues partagés (companies, genres, platforms, ratings, stores...)
--     NON extraits : ils restent en base, donc la réimport fonctionne.
-- ============================================================================

\set ON_ERROR_STOP on
\if :{?out}
\else
  \set out scripts/dumps/old_games_extract.sql
\endif

-- Critère des jeux ciblés : soit -v filter="<prédicat SQL>" (ex.
-- "release_date IS NULL"), soit -v cutoff=DATE (release_date < cutoff, NULL
-- exclus). Par défaut cutoff = 2006-06-03.
\if :{?filter}
CREATE TEMP TABLE _old_games AS SELECT id FROM games WHERE :filter;
\else
\if :{?cutoff}
\else
  \set cutoff 2006-06-03
\endif
CREATE TEMP TABLE _old_games AS
SELECT id FROM games WHERE release_date IS NOT NULL AND release_date < :'cutoff'::date;
\endif

\echo '--- Jeux ciblés :'
SELECT count(*) AS games_to_extract FROM _old_games;

-- Mode brut : sorties SELECT sans entête/pied, une valeur par ligne.
\pset format unaligned
\pset tuples_only on
\o :out

SELECT '-- Dump réimportable : jeux ciblés + données associées';
SELECT 'BEGIN;';

-- 1. Parent
SELECT 'COPY public.games FROM stdin;';
COPY (SELECT * FROM games WHERE id IN (SELECT id FROM _old_games)) TO STDOUT;
SELECT '\.';

-- 2. Catalogue lié au jeu (game_id -> games)
SELECT 'COPY public.game_translations FROM stdin;';
COPY (SELECT * FROM game_translations WHERE game_id IN (SELECT id FROM _old_games)) TO STDOUT;
SELECT '\.';
SELECT 'COPY public.game_genres FROM stdin;';
COPY (SELECT * FROM game_genres WHERE game_id IN (SELECT id FROM _old_games)) TO STDOUT;
SELECT '\.';
SELECT 'COPY public.game_screenshots FROM stdin;';
COPY (SELECT * FROM game_screenshots WHERE game_id IN (SELECT id FROM _old_games)) TO STDOUT;
SELECT '\.';
SELECT 'COPY public.game_artwork FROM stdin;';
COPY (SELECT * FROM game_artwork WHERE game_id IN (SELECT id FROM _old_games)) TO STDOUT;
SELECT '\.';
SELECT 'COPY public.game_videos FROM stdin;';
COPY (SELECT * FROM game_videos WHERE game_id IN (SELECT id FROM _old_games)) TO STDOUT;
SELECT '\.';
SELECT 'COPY public.game_companies FROM stdin;';
COPY (SELECT * FROM game_companies WHERE game_id IN (SELECT id FROM _old_games)) TO STDOUT;
SELECT '\.';
SELECT 'COPY public.game_ratings FROM stdin;';
COPY (SELECT * FROM game_ratings WHERE game_id IN (SELECT id FROM _old_games)) TO STDOUT;
SELECT '\.';
SELECT 'COPY public.game_rating_descriptors FROM stdin;';
COPY (SELECT * FROM game_rating_descriptors WHERE game_rating_id IN
  (SELECT id FROM game_ratings WHERE game_id IN (SELECT id FROM _old_games))) TO STDOUT;
SELECT '\.';
SELECT 'COPY public.game_prices FROM stdin;';
COPY (SELECT * FROM game_prices WHERE game_id IN (SELECT id FROM _old_games)) TO STDOUT;
SELECT '\.';
SELECT 'COPY public.game_price_history FROM stdin;';
COPY (SELECT * FROM game_price_history WHERE game_id IN (SELECT id FROM _old_games)) TO STDOUT;
SELECT '\.';
SELECT 'COPY public.game_platforms FROM stdin;';
COPY (SELECT * FROM game_platforms WHERE game_id IN (SELECT id FROM _old_games)) TO STDOUT;
SELECT '\.';
SELECT 'COPY public.game_languages FROM stdin;';
COPY (SELECT * FROM game_languages WHERE game_id IN (SELECT id FROM _old_games)) TO STDOUT;
SELECT '\.';
SELECT 'COPY public.game_versions FROM stdin;';
COPY (SELECT * FROM game_versions WHERE game_id IN (SELECT id FROM _old_games)) TO STDOUT;
SELECT '\.';
SELECT 'COPY public.game_version_translations FROM stdin;';
COPY (SELECT * FROM game_version_translations WHERE game_version_id IN
  (SELECT id FROM game_versions WHERE game_id IN (SELECT id FROM _old_games))) TO STDOUT;
SELECT '\.';
SELECT 'COPY public.game_music FROM stdin;';
COPY (SELECT * FROM game_music WHERE game_id IN (SELECT id FROM _old_games)) TO STDOUT;
SELECT '\.';
SELECT 'COPY public.game_dlc_extensions FROM stdin;';
COPY (SELECT * FROM game_dlc_extensions WHERE game_id IN (SELECT id FROM _old_games)) TO STDOUT;
SELECT '\.';
SELECT 'COPY public.game_field_overrides FROM stdin;';
COPY (SELECT * FROM game_field_overrides WHERE game_id IN (SELECT id FROM _old_games)) TO STDOUT;
SELECT '\.';
SELECT 'COPY public.game_similar_games FROM stdin;';
COPY (SELECT * FROM game_similar_games WHERE game_id IN (SELECT id FROM _old_games)) TO STDOUT;
SELECT '\.';
SELECT 'COPY public.character_games FROM stdin;';
COPY (SELECT * FROM character_games WHERE game_id IN (SELECT id FROM _old_games)) TO STDOUT;
SELECT '\.';
SELECT 'COPY public.coach_games FROM stdin;';
COPY (SELECT * FROM coach_games WHERE game_id IN (SELECT id FROM _old_games)) TO STDOUT;
SELECT '\.';

-- 3. Données utilisateur (supprimées en CASCADE avec le jeu → incluses pour
--    une réintégration sans perte ; les profils/users restent en base).
SELECT 'COPY public.user_library FROM stdin;';
COPY (SELECT * FROM user_library WHERE game_id IN (SELECT id FROM _old_games)) TO STDOUT;
SELECT '\.';
SELECT 'COPY public.game_reviews FROM stdin;';
COPY (SELECT * FROM game_reviews WHERE game_id IN (SELECT id FROM _old_games)) TO STDOUT;
SELECT '\.';
SELECT 'COPY public.review_votes FROM stdin;';
COPY (SELECT * FROM review_votes WHERE review_id IN
  (SELECT id FROM game_reviews WHERE game_id IN (SELECT id FROM _old_games))) TO STDOUT;
SELECT '\.';
SELECT 'COPY public.game_sessions FROM stdin;';
COPY (SELECT * FROM game_sessions WHERE game_id IN (SELECT id FROM _old_games)) TO STDOUT;
SELECT '\.';
SELECT 'COPY public.game_collection_items FROM stdin;';
COPY (SELECT * FROM game_collection_items WHERE game_id IN (SELECT id FROM _old_games)) TO STDOUT;
SELECT '\.';

SELECT 'COMMIT;';
\o
\echo '--- Dump écrit dans' :'out'
