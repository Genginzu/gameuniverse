/**
 * Tests for admin genders API routes (list + detail), run against the real
 * route handlers with a mocked Supabase client.
 */

import { describe, vi } from "vitest";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";
import { runTaxonomyRouteSuite } from "@/test-helpers/taxonomy-route-suite";
import { useTestRouteEnvironment } from "@/test-helpers/route-environment";

const db = createSupabaseQueryMock();
const routeEnv = useTestRouteEnvironment({ signedInAs: "admin" });

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () => Promise.resolve(db.client),
}));

const list = await import("@/app/api/admin/genders/route");
const detail = await import("@/app/api/admin/genders/[id]/route");

describe("Admin genders API", () => {
  runTaxonomyRouteSuite({
    basePath: "/api/admin/genders",
    table: "genders",
    translationsTable: "gender_translations",
    foreignKey: "gender_id",
    listKey: "genders",
    itemKey: "gender",
    notFoundMessage: "Gender not found",
    db,
    routeEnv,
    list,
    detail,
  });
});
