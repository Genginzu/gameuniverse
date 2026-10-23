import { createAdminUsageRoute } from "@/lib/services/adminUsageRoute";

export const GET = createAdminUsageRoute({
  table: "ratings",
  keyColumn: "id",
  param: "ratingId",
  references: [{ table: "game_ratings", column: "rating_id" }],
});
