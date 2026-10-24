import { defineAdminResource } from "@/lib/admin-resource/defineAdminResource";
import type { AdminRating } from "@/types/admin-age-classifications";

export const ratingsResource = defineAdminResource<AdminRating>({
  path: ({ ratingSystemId }) =>
    `/api/admin/age-classifications/${encodeURIComponent(ratingSystemId ?? "")}/ratings`,
  listKey: "ratings",
  keyOf: (rating) => rating.id,
  paginated: false,
  usage: true,
});
