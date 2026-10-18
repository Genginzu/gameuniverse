/**
 * Structural regression guard for the coaching_reviews hardening migration
 * (issue #377). The DB-level RLS/trigger behaviour cannot be executed here (no
 * local database), so this reads the real migration file and asserts that each
 * acceptance criterion is encoded in the SQL. It fails loudly if a future edit
 * removes one of the guards.
 */

import { describe, test, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20261018000003_harden_coaching_reviews_rls.sql"
);

const sql = readFileSync(MIGRATION_PATH, "utf8");
const normalized = sql.replace(/\s+/g, " ");

describe("Migration 20261018000003 — coaching_reviews hardening", () => {
  test("INSERT policy requires a completed session owned by the student", () => {
    expect(normalized).toContain('CREATE POLICY "Students can create reviews for completed sessions"');
    expect(normalized).toContain("FROM public.coaching_sessions cs");
    expect(normalized).toContain("cs.student_id = auth.uid()");
    expect(normalized).toContain("cs.coach_id = coaching_reviews.coach_id");
    expect(normalized).toContain("cs.status = 'completed'");
  });

  test("the old permissive insert policy is dropped", () => {
    expect(normalized).toContain(
      'DROP POLICY IF EXISTS "Students can create reviews" ON public.coaching_reviews'
    );
  });

  test("one review per session is enforced by a unique constraint", () => {
    expect(normalized).toContain("coaching_reviews_session_id_key");
    expect(normalized).toContain("UNIQUE (session_id)");
  });

  test("the migration fails loudly on pre-existing duplicate reviews", () => {
    expect(normalized).toContain("GROUP BY session_id HAVING COUNT(*) > 1");
    expect(normalized).toMatch(/RAISE EXCEPTION[^;]*duplicate reviews/);
  });

  test("coach UPDATE policy has a WITH CHECK", () => {
    expect(normalized).toContain('CREATE POLICY "Coaches can respond to their reviews"');
    // Both USING and WITH CHECK scope the coach to their own profile.
    const coachClauses = normalized.match(
      /coach_id IN \( SELECT id FROM public\.coach_profiles WHERE player_id = auth\.uid\(\) \)/g
    );
    expect(coachClauses?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(normalized).toContain("WITH CHECK");
  });

  test("a BEFORE UPDATE trigger restricts which columns each role may change", () => {
    expect(normalized).toContain("CREATE OR REPLACE FUNCTION public.enforce_coaching_review_update()");
    expect(normalized).toContain("BEFORE UPDATE ON public.coaching_reviews");
    // Coach is blocked from changing rating / comment.
    expect(normalized).toContain("coaches can only set coach_response, not rating or comment");
    // Student is blocked from changing coach response fields.
    expect(normalized).toContain("students cannot change coach response fields");
    // Identity columns immutable.
    expect(normalized).toContain("identity columns are immutable");
  });

  test("the enforcement trigger bypasses internal (service) roles", () => {
    expect(normalized).toContain("auth.role() NOT IN ('authenticated', 'anon')");
  });

  test("the aggregate trigger function handles INSERT/UPDATE/DELETE and is hardened", () => {
    expect(normalized).toContain("CREATE OR REPLACE FUNCTION public.update_coach_average_rating()");
    expect(normalized).toContain("RETURN COALESCE(NEW, OLD)");
    expect(normalized).toContain("COALESCE(NEW.coach_id, OLD.coach_id)");
    expect(normalized).toContain("SECURITY DEFINER");
  });

  test("every SECURITY DEFINER function sets a non-mutable search_path", () => {
    // Only inspect real function definitions (a SECURITY DEFINER inside a
    // function body), not prose mentions of the phrase in header comments.
    const definerBlocks = sql
      .split("SECURITY DEFINER")
      .slice(1)
      .filter((block) => /^\s*(SET\b|LANGUAGE\b|AS \$\$)/.test(block));
    expect(definerBlocks.length).toBeGreaterThan(0);
    for (const block of definerBlocks) {
      expect(block).toMatch(/SET search_path = (public|'')/);
    }
  });
});
