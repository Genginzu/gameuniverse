-- Stop granting new tables, sequences and functions to anon / authenticated
-- automatically.
--
-- Context:
--   20260911000001 (and Supabase's own defaults) set ALTER DEFAULT PRIVILEGES
--   so that every new object in public created by postgres was granted to anon
--   and authenticated: full DML on tables, EXECUTE on functions (functions also
--   get EXECUTE TO PUBLIC by default in PostgreSQL). A new table with a missing
--   or wrong RLS policy, or a new SECURITY DEFINER function, was therefore
--   reachable through PostgREST the moment it was created.
--
-- Fix (future objects only; existing grants are unchanged):
--   * new tables / sequences / functions in public are granted to service_role
--     only;
--   * PUBLIC loses the implicit EXECUTE on new functions.
--   Every migration that creates an object reachable by clients must now GRANT
--   it explicitly (see docs/systems/database-privileges.md and AGENTS.md).

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- The implicit EXECUTE TO PUBLIC on new functions is a global default:
-- per-schema default privileges can only add to it, so it must be revoked
-- globally (no IN SCHEMA) for objects created by postgres.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO service_role;
