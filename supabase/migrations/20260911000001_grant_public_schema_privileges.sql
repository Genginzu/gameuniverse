-- Migration: Restore standard Supabase table privileges on the public schema.
--
-- Root cause of "permission denied for ..." (SQLSTATE 42501):
--   Postgres enforces two independent permission layers:
--     1. Table-level GRANTs (SQL privileges on the object).
--     2. Row Level Security policies (which rows a role may see/modify).
--   Migrations from 20260422* onward (coaching, esport, fantasy, gu_coins,
--   pandascore, match_comments) create tables + RLS policies but never GRANT
--   table-level privileges, relying on Supabase default privileges that were
--   not applied to these objects. A missing GRANT raises 42501; an RLS denial
--   would instead return zero rows. Both layers are required.
--
-- Safety: every table in the public schema has RLS enabled, so broad grants
-- do not expose data — RLS still filters rows. This mirrors Supabase's default
-- posture (privileges granted to anon/authenticated, access gated by RLS).

-- =============================================================================
-- 1. Grant privileges on all existing objects
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- =============================================================================
-- 2. Ensure future objects inherit the same privileges
-- =============================================================================

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
