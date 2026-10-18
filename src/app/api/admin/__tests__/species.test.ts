/**
 * Tests for admin species API routes (list + detail), run against the real
 * route handlers with a mocked Supabase client.
 */

import { describe, vi } from "vitest";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";
import { runTaxonomyRouteSuite } from "@/test-helpers/taxonomy-route-suite";

const db = createSupabaseQueryMock();
const requireAdmin = vi.fn();

vi.mock("@/lib/auth-admin", () => ({ requireAdmin: () => requireAdmin() }));
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () => Promise.resolve(db.client),
}));

const list = await import("@/app/api/admin/species/route");
const detail = await import("@/app/api/admin/species/[id]/route");

describe("Admin species API", () => {
  runTaxonomyRouteSuite({
    basePath: "/api/admin/species",
    table: "species",
    translationsTable: "species_translations",
    foreignKey: "species_id",
    listKey: "species",
    itemKey: "species",
    notFoundMessage: "Species not found",
    db,
    requireAdmin,
    list,
    detail,
  });
});
