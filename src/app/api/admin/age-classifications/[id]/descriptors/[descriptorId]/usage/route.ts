import { createAdminUsageRoute } from "@/lib/services/adminUsageRoute";

export const GET = createAdminUsageRoute({
  table: "content_descriptors",
  keyColumn: "id",
  param: "descriptorId",
  references: [{ table: "game_rating_descriptors", column: "content_descriptor_id" }],
});
