import { createAdminUsageRoute } from "@/lib/services/adminUsageRoute";

export const GET = createAdminUsageRoute({
  table: "genres",
  keyColumn: "slug",
  param: "slug",
  references: [{ table: "game_genres", column: "genre_id" }],
});
