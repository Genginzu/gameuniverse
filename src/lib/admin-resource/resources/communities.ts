import { defineAdminResource } from "@/lib/admin-resource/defineAdminResource";
import type { AdminCommunity } from "@/types/admin-communities";

export const communitiesResource = defineAdminResource<AdminCommunity>({
  path: "/api/admin/communities",
  listKey: "communities",
  keyOf: (community) => community.id,
  defaultSort: { field: "created_at", order: "desc" },
});
