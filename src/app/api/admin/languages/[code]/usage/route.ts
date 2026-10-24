import { createAdminUsageRoute } from "@/lib/services/adminUsageRoute";

export const GET = createAdminUsageRoute({
  table: "supported_languages",
  keyColumn: "code",
  param: "code",
  refColumn: "code",
  references: [{ table: "game_languages", column: "language_code" }],
});
