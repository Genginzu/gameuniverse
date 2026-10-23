/**
 * Structural regression guards for migration 20261023000001.
 * Vitest has no database, so these read the real migration file.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const sql = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20261023000001_coaching_refund_pending.sql"),
  "utf8"
);

describe("Migration 20261023000001 - coaching refund_pending", () => {
  it("allows refund_pending in the payment_status check", () => {
    expect(sql).toMatch(
      /coaching_sessions_payment_status_check\s+CHECK \(payment_status IN \([^)]*'refund_pending'/
    );
  });

  it("lets a coach start only a paid session", () => {
    expect(sql).not.toContain("('confirmed', 'in_progress')");
    expect(sql).toMatch(/OLD\.status = 'confirmed' AND NEW\.status = 'in_progress'\s+AND OLD\.payment_status = 'paid'/);
  });

  it("keeps payment columns server-only and the function non-callable by clients", () => {
    expect(sql).toContain("NEW.payment_status IS DISTINCT FROM OLD.payment_status");
    expect(sql).toContain("REVOKE EXECUTE ON FUNCTION public.enforce_coaching_session_write() FROM PUBLIC, anon, authenticated");
  });
});

describe("Migration 20261023000002 - purge keeps refund_pending sessions", () => {
  const purgeSql = readFileSync(
    join(process.cwd(), "supabase", "migrations", "20261023000002_purge_keeps_refund_pending_sessions.sql"),
    "utf8"
  );

  it("retains refund_pending sessions as accounting records", () => {
    expect(purgeSql).toContain(
      "cs.payment_status IN ('paid', 'refund_pending', 'released', 'refunded')"
    );
  });

  it("keeps the purge callable by the service role only", () => {
    expect(purgeSql).toContain(
      "REVOKE ALL ON FUNCTION public.purge_account_data(uuid) FROM PUBLIC, anon, authenticated"
    );
    expect(purgeSql).toContain(
      "GRANT EXECUTE ON FUNCTION public.purge_account_data(uuid) TO service_role"
    );
  });
});
