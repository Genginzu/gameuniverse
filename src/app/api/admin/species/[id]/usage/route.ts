import { createAdminUsageRoute } from "@/lib/services/adminUsageRoute";

export const GET = createAdminUsageRoute({
  table: "species",
  keyColumn: "id",
  param: "id",
  references: [{ table: "characters", column: "species_id" }],
});
