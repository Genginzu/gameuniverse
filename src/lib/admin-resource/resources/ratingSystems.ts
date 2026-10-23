import { defineAdminResource } from "@/lib/admin-resource/defineAdminResource";
import type { AdminRatingSystem } from "@/types/admin-age-classifications";

export const ratingSystemsResource = defineAdminResource<AdminRatingSystem>({
  path: "/api/admin/age-classifications",
  listKey: "ratingSystems",
  keyOf: (system) => system.id,
  defaultSort: { field: "code", order: "asc" },
  usage: true,
});
