-- Rétention de igdb_webhook_events : purge automatique des events de plus de
-- 7 jours via pg_cron (rétention glissante).
--
-- igdb_webhook_events est un journal d'audit des webhooks IGDB. On ne conserve
-- que 7 jours d'historique. Le trigger AFTER INSERT (appel de l'Edge Function
-- igdb-processor) n'est PAS affecté : un DELETE ne le déclenche pas.
--
-- pg_cron (1.6.x) est déjà activé sur le projet (schéma pg_catalog). Ce cron est
-- du SQL pur (DELETE) : il ne dépend pas de app.settings.* (contrairement aux
-- crons qui POSTent une Edge Function via net.http_post, configurés côté
-- Dashboard), il peut donc être déclaré ici sans erreur de permission.

-- Fonction de purge (search_path verrouillé pour le linter Supabase).
CREATE OR REPLACE FUNCTION public.cleanup_old_igdb_webhook_events()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  DELETE FROM public.igdb_webhook_events
  WHERE created_at < now() - interval '7 days';
$$;

COMMENT ON FUNCTION public.cleanup_old_igdb_webhook_events() IS
  'Purge les events igdb_webhook_events de plus de 7 jours (rétention glissante), exécutée quotidiennement par pg_cron.';

-- Planification quotidienne à 03:00 UTC. cron.schedule(nom, ...) fait un upsert
-- par nom de job → idempotent. Guardé si pg_cron absent (ex. reset local).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cleanup-igdb-webhook-events',
      '0 3 * * *',
      $cron$SELECT public.cleanup_old_igdb_webhook_events();$cron$
    );
  END IF;
END $$;
