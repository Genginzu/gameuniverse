import { createAdminUsageRoute } from "@/lib/services/adminUsageRoute";

export const GET = createAdminUsageRoute({
  table: "companies",
  keyColumn: "slug",
  param: "slug",
  references: [{ table: "game_companies", column: "company_id" }],
});
