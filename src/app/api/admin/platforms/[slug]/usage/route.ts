import { createAdminUsageRoute } from "@/lib/services/adminUsageRoute";

export const GET = createAdminUsageRoute({
  table: "platforms",
  keyColumn: "slug",
  param: "slug",
  references: [{ table: "game_platforms", column: "platform_id" }],
});
