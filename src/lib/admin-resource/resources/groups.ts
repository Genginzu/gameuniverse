import { defineAdminResource } from "@/lib/admin-resource/defineAdminResource";
import type { AdminGroup } from "@/types/admin-groups";

export const groupsResource = defineAdminResource<AdminGroup>({
  path: "/api/admin/groups",
  listKey: "groups",
  keyOf: (group) => group.id,
  defaultSort: { field: "created_at", order: "desc" },
});
