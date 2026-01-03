-- Fichier seed principal
-- Les fichiers dans supabase/seeds/ sont exécutés automatiquement dans l'ordre alphabétique
-- Ce fichier peut contenir des seeds supplémentaires ou des validations finales

-- Validation finale après l'exécution de tous les seeds
DO $$
BEGIN
  RAISE NOTICE '- Tous les seeds ont été appliqués';
END
$$;