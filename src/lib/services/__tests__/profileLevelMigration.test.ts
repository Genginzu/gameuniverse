/**
 * Structural regression guard for the server-only profiles.level migration
 * (issue #386). The trigger and grants cannot be executed by Vitest (no
 * database), so this reads the real migration file and asserts each guard is
 * encoded in the SQL. Behaviour was verified against a local Supabase.
 */

import { describe, test, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20261018000005_protect_profile_level.sql"
);

const normalized = readFileSync(MIGRATION_PATH, "utf8").replace(/\s+/g, " ");

describe("Migration 20261018000005 - server-only profiles.level", () => {
  test("the trigger only restricts client roles, so service_role keeps writing the level", () => {
    expect(normalized).toContain("IF auth.role() IN ('authenticated', 'anon') THEN");
  });

  test("client updates that change the level are rejected", () => {
    expect(normalized).toContain(
      "IF TG_OP = 'UPDATE' AND NEW.level IS DISTINCT FROM OLD.level THEN"
    );
  });

  test("client inserts cannot start above the default level", () => {
    expect(normalized).toContain("IF TG_OP = 'INSERT' AND NEW.level IS DISTINCT FROM 1 THEN");
  });

  test("rejections use the insufficient_privilege error code", () => {
    expect(normalized).toContain("USING ERRCODE = '42501'");
  });

  test("the trigger runs before both inserts and updates on profiles", () => {
    expect(normalized).toContain(
      "CREATE TRIGGER trg_protect_profile_level BEFORE INSERT OR UPDATE ON public.profiles " +
        "FOR EACH ROW EXECUTE FUNCTION public.protect_profile_level()"
    );
  });

  test("count_recent_game_imports is no longer executable by clients", () => {
    expect(normalized).toContain(
      "REVOKE EXECUTE ON FUNCTION public.count_recent_game_imports(UUID, INTEGER) " +
        "FROM PUBLIC, anon, authenticated"
    );
    expect(normalized).toContain(
      "GRANT EXECUTE ON FUNCTION public.count_recent_game_imports(UUID, INTEGER) TO service_role"
    );
  });
});
