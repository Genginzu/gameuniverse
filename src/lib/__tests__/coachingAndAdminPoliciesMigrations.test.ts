/**
 * Structural regression guards for migrations 20261018000007 and 20261018000008.
 * Vitest has no database, so these read the real migration files.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (name: string) =>
  readFileSync(join(process.cwd(), "supabase", "migrations", name), "utf8");

const policiesSql = read("20261018000007_admin_policies_use_is_admin.sql");
const coachingSql = read("20261018000008_harden_coaching_sessions.sql");
const policyStatements = policiesSql.split(";").filter((s) => s.includes("CREATE POLICY"));

describe("Migration 20261018000007 - admin policies use is_admin()", () => {
  it("recreates the seven user_metadata admin policies", () => {
    expect(policyStatements).toHaveLength(7);
  });

  it("delegates every recreated policy to public.is_admin()", () => {
    for (const statement of policyStatements) {
      expect(statement).toContain("public.is_admin()");
      expect(statement).not.toContain("auth.jwt()");
    }
  });
});

describe("Migration 20261018000008 - coaching_sessions guard", () => {
  it("adds a WITH CHECK to the update policy", () => {
    expect(coachingSql).toMatch(/"coaching_sessions_update"[\s\S]*WITH CHECK/);
  });

  it("derives price and duration from the coach tier on insert", () => {
    expect(coachingSql).toContain("NEW.payment_amount := v_price");
    expect(coachingSql).toContain("NEW.duration_minutes := v_duration");
    expect(coachingSql).toContain("g.coach_id = NEW.coach_id");
  });

  it("makes payment and schedule columns server-only on update", () => {
    expect(coachingSql).toContain("NEW.payment_status IS DISTINCT FROM OLD.payment_status");
    expect(coachingSql).toContain("NEW.scheduled_at IS DISTINCT FROM OLD.scheduled_at");
    expect(coachingSql).toContain("BEFORE INSERT OR UPDATE ON public.coaching_sessions");
  });
});
