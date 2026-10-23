import { createAdminUsageRoute } from "@/lib/services/adminUsageRoute";

export const GET = createAdminUsageRoute({
  table: "genders",
  keyColumn: "id",
  param: "id",
  references: [{ table: "characters", column: "gender_id" }],
});
