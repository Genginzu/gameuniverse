import { createAdminUsageRoute } from "@/lib/services/adminUsageRoute";

export const GET = createAdminUsageRoute({
  table: "character_roles",
  keyColumn: "slug",
  param: "slug",
  references: [{ table: "character_character_roles", column: "role_id" }],
});
