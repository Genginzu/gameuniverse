-- Server-only profiles.level and private import counter (issue #386).
--
-- Context:
--   profiles.level is derived from player_xp.xp_total and written by the
--   achievement engine with the service-role client. Since #372 player_xp is
--   server-only, but 20261018000001 still grants UPDATE on the whole profiles
--   row to authenticated, so a logged-in user could set their own level.
--   count_recent_game_imports (20261018000004) kept the default PUBLIC EXECUTE,
--   so any caller could read another user's recent import count.
--
-- Fix:
--   1. A BEFORE INSERT OR UPDATE trigger rejects client (anon/authenticated)
--      writes to profiles.level, following protect_profile_suspension
--      (20261002000001). service_role and the signup trigger are unaffected.
--   2. count_recent_game_imports is executable by service_role only.

-- =============================================================================
-- 1. profiles.level is written server-side only
-- =============================================================================

CREATE OR REPLACE FUNCTION public.protect_profile_level()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF auth.role() IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' AND NEW.level IS DISTINCT FROM 1 THEN
      RAISE EXCEPTION 'profiles.level is derived from XP and cannot be set by clients'
        USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.level IS DISTINCT FROM OLD.level THEN
      RAISE EXCEPTION 'profiles.level is derived from XP and cannot be set by clients'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.protect_profile_level() IS
  'Rejects anon/authenticated writes to profiles.level; the level is derived '
  'from player_xp and written by the service role only (issue #386).';

DROP TRIGGER IF EXISTS trg_protect_profile_level ON public.profiles;
CREATE TRIGGER trg_protect_profile_level
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_level();

-- =============================================================================
-- 2. count_recent_game_imports is a server-only helper
-- =============================================================================

REVOKE EXECUTE ON FUNCTION public.count_recent_game_imports(UUID, INTEGER)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.count_recent_game_imports(UUID, INTEGER)
  TO service_role;
