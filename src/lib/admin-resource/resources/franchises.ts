import { defineAdminResource } from "@/lib/admin-resource/defineAdminResource";
import type { AdminFranchiseListItem } from "@/types/admin-franchises";

export const franchisesResource = defineAdminResource<AdminFranchiseListItem>({
  path: "/api/admin/franchises",
  listKey: "franchises",
  keyOf: (franchise) => franchise.id,
  defaultSort: { field: "name", order: "asc" },
  usage: true,
});
