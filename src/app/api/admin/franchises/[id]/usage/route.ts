import { createAdminUsageRoute } from "@/lib/services/adminUsageRoute";

export const GET = createAdminUsageRoute({
  table: "franchises",
  keyColumn: "id",
  param: "id",
  references: [{ table: "game_franchises", column: "franchise_id" }],
});
