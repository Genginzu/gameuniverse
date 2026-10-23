import { defineAdminResource } from "@/lib/admin-resource/defineAdminResource";
import type { AdminReview } from "@/types/admin-reviews";

export const reviewsResource = defineAdminResource<AdminReview>({
  path: "/api/admin/reviews",
  listKey: "reviews",
  keyOf: (review) => review.id,
  defaultSort: { field: "created_at", order: "desc" },
});
