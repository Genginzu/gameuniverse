-- Suppression d'index strictement redondants sur igdb_global_sync : chacun a une
-- définition IDENTIQUE à un autre index déjà présent → aucun impact sur les
-- requêtes (l'index jumeau couvre les mêmes accès), uniquement un gain d'espace.
--
--   idx_igdb_global_sync_igdb_id              == igdb_global_sync_igdb_id_key (UNIQUE) sur (igdb_id)
--   idx_igdb_global_sync_unmetascore_igdb_id  == idx_igs_unmetascore
--   idx_igs_uncolors                          == idx_igdb_global_sync_uncolors_igdb_id
--   idx_igs_unsynced                          == idx_igdb_global_sync_unsynced_igdb_id
--
-- On conserve un index de chaque paire ; on retire le doublon.

DROP INDEX IF EXISTS public.idx_igdb_global_sync_igdb_id;
DROP INDEX IF EXISTS public.idx_igdb_global_sync_unmetascore_igdb_id;
DROP INDEX IF EXISTS public.idx_igs_uncolors;
DROP INDEX IF EXISTS public.idx_igs_unsynced;
