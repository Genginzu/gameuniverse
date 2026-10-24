import { defineAdminResource } from "@/lib/admin-resource/defineAdminResource";
import type { AdminComment } from "@/types/admin-comments";

export const commentsResource = defineAdminResource<AdminComment>({
  path: "/api/admin/comments",
  listKey: "comments",
  keyOf: (comment) => comment.id,
  defaultSort: { field: "created_at", order: "desc" },
});
