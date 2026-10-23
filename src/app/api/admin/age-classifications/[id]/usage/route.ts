import { createAdminUsageRoute } from "@/lib/services/adminUsageRoute";

export const GET = createAdminUsageRoute({
  table: "rating_systems",
  keyColumn: "id",
  param: "id",
  references: [
    { table: "ratings", column: "rating_system_id" },
    { table: "content_descriptors", column: "rating_system_id" },
  ],
});
