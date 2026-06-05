-- ============================================================================
-- Script : Suppression des jeux de plus de 20 ans
-- ⚠️  DESTRUCTIF ET IRRÉVERSIBLE — n'exécuter QU'APRÈS avoir vérifié le dump
--     produit par scripts/db/extract-old-games.sql.
--
-- Par défaut le script finit par ROLLBACK (dry-run : il exécute tout puis
-- annule). Remplacer ROLLBACK par COMMIT pour supprimer réellement.
--
-- Effet : DELETE FROM games (ciblés). Le ON DELETE CASCADE supprime toutes les
--         tables enfants ; les FK SET NULL (igdb_webhook_events,
--         game_similar_games.similar_game_id, igdb_global_sync.matched_game_id)
--         sont mises à NULL. Catalogues partagés CONSERVÉS.
--
-- Perf : le DELETE déclenche ~1M d'actions RI par-ligne (41k jeux × enfants).
--        On désactive le statement_timeout (2min par défaut) et on indexe la
--        seule colonne FK non indexée (game_sessions.game_id).
--
-- Usage :
--   psql "$DB_URL" -v cutoff=2006-06-03 -f scripts/db/delete-old-games.sql
--   (utiliser EXACTEMENT le même cutoff que l'extraction)
-- ============================================================================

\set ON_ERROR_STOP on

SET statement_timeout = 0;

-- Seule colonne FK vers games sans index de support (sinon seq-scan/jeu).
CREATE INDEX IF NOT EXISTS tmp_idx_game_sessions_game_id ON public.game_sessions(game_id);

BEGIN;

-- Critère : -v filter="<prédicat>" OU -v cutoff=DATE (release_date < cutoff,
-- NULL exclus). Par défaut cutoff = 2006-06-03.
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

\echo '--- Jeux qui vont être supprimés :'
SELECT count(*) AS games_to_delete FROM _old_games;

-- coaching_sessions.game_id est en NO ACTION : à retirer avant le DELETE games.
DELETE FROM coaching_sessions WHERE game_id IN (SELECT id FROM _old_games);

-- Suppression principale : CASCADE pour les enfants, SET NULL pour les 3 refs.
DELETE FROM games WHERE id IN (SELECT id FROM _old_games);

-- Par défaut ROLLBACK (dry-run). Passer -v commit=1 pour supprimer réellement.
\if :{?commit}
COMMIT;
\else
\echo 'DRY-RUN : ROLLBACK (relancer avec -v commit=1 pour supprimer reellement)'
ROLLBACK;
\endif

-- Nettoyage de l'index temporaire.
DROP INDEX IF EXISTS public.tmp_idx_game_sessions_game_id;
