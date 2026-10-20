/**
 * Structural regression guard for the is_admin() migration (issue #390).
 * Vitest has no database, so this reads the real migration file and asserts
 * that the admin role comes from app_metadata only. Behaviour was verified
 * against a local Supabase.
 */

import { describe, test, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20261018000006_is_admin_app_metadata.sql"
);

const sql = readFileSync(MIGRATION_PATH, "utf8");
const functionBody = sql.slice(sql.indexOf("AS $$"), sql.lastIndexOf("$$;"));
const normalized = functionBody.replace(/\s+/g, " ");

describe("Migration 20261018000006 - is_admin() reads app_metadata", () => {
  test("keeps the signature used by the RLS policies", () => {
    expect(sql).toContain(
      "CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())"
    );
  });

  test("grants admin from raw_app_meta_data only", () => {
    expect(normalized).toContain("u.raw_app_meta_data->>'role' = 'admin'");
  });

  test("no longer trusts user_metadata or the email domain", () => {
    expect(functionBody).not.toContain("raw_user_meta_data");
    expect(functionBody).not.toContain("email");
  });
});
